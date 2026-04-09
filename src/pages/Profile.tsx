import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Camera, Lock, User as UserIcon } from 'lucide-react';

export default function Profile() {
  const { user, profile, role, loading: authLoading } = useAuth();
  
  // Profile data state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [registerNumber, setRegisterNumber] = useState(profile?.register_number || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpStatus, setOtpStatus] = useState<'idle' | 'requested' | 'verified'>('idle');

  // Avatar state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestOtpFromSuperior = async () => {
    if (!user || !profile || !role) return;

    if (role === 'md') {
      toast.info('Please contact the System Administrator directly to reset your password.');
      return;
    }

    setIsRequestingOtp(true);
    try {
      let superiorId: string | null = null;
      let superiorName = '';
      let superiorTitle = '';

      if (role === 'watchman' || role === 'principal') {
        // Route to MD
        if (!profile.md_id) {
          throw new Error('No MD assigned to your account. Please contact administration directly.');
        }

        const { data: mdProfile, error: mdError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', profile.md_id)
          .maybeSingle();

        if (mdError || !mdProfile) {
          throw new Error('MD details not found. Please contact administration directly.');
        }

        superiorId = profile.md_id;
        superiorName = mdProfile.full_name;
        superiorTitle = 'MD';
      } else if (role === 'student' || role === 'staff') {
        // Route to HOD (Department-based)
        if (!profile.department) {
          throw new Error('No department assigned to your profile. Please contact administration.');
        }

        const { data: hods } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('department', profile.department)
          .neq('user_id', user.id);

        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'hod')
          .in('user_id', (hods || []).map(h => h.user_id));

        const departmentHod = hods?.find(h => roles?.some(r => r.user_id === h.user_id));

        if (!departmentHod) {
          throw new Error('No HOD found for your department. Please contact administration directly.');
        }

        superiorId = departmentHod.user_id;
        superiorName = departmentHod.full_name;
        superiorTitle = 'HOD';
      } else if (role === 'hod') {
        // Route to Principal (Institute-based)
        if (!profile.institute) {
          throw new Error('No institute assigned to your profile. Please contact administration.');
        }

        const { data: principals } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('institute', profile.institute)
          .neq('user_id', user.id);

        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'principal')
          .in('user_id', (principals || []).map(p => p.user_id));

        const institutePrincipal = principals?.find(p => roles?.some(r => r.user_id === p.user_id));

        if (!institutePrincipal) {
          throw new Error('No Principal found for your institute. Please contact administration directly.');
        }

        superiorId = institutePrincipal.user_id;
        superiorName = institutePrincipal.full_name;
        superiorTitle = 'Principal';
      } else if (role === 'admin') {
        toast.info('As an admin, please use the standard Supabase dashboard or contact another admin.');
        setIsRequestingOtp(false);
        return;
      }

      if (!superiorId) {
        throw new Error('Could not identify your superior for OTP routing.');
      }

      // 2. Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // 3. Store OTP
      const { error: otpError } = await supabase
        .from('password_reset_otps')
        .insert({
          user_id: user.id,
          otp_code: generatedOtp,
          expires_at: expiresAt,
        });

      if (otpError) throw otpError;

      // 4. Send Notification to Superior
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: superiorId,
        title: '🔑 Password Reset OTP Request',
        message: `${role.toUpperCase()}: ${profile.full_name} has requested an OTP to reset their password. CODE: ${generatedOtp}. This expires in 10 minutes.`,
        type: 'system',
      });

      if (notifError) throw notifError;

      setOtpStatus('requested');
      toast.success(`OTP has been sent to your ${superiorTitle} (${superiorName}). Please collect it from them.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to request OTP');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!user || !otpCode) return;

    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('user_id', user.id)
        .eq('otp_code', otpCode)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        throw new Error('Invalid or expired OTP code.');
      }

      await supabase
        .from('password_reset_otps')
        .update({ is_used: true } as any)
        .eq('id', data.id);

      setOtpStatus('verified');
      toast.success('OTP Verified! You can now set a new password.');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          register_number: registerNumber
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      toast.error('Passwords do not match or are empty.');
      return;
    }

    if (otpStatus !== 'verified' && !oldPassword) {
      toast.error('Please enter your old password or verify with an OTP from HOD.');
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      // If not using OTP, we must verify the old password first
      if (otpStatus !== 'verified') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: oldPassword,
        });

        if (authError) {
          throw new Error('Incorrect old password. Use the "Forgot Password" link if needed.');
        }
      }

      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      toast.success('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setOldPassword('');
      setOtpStatus('idle');
      setOtpCode('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Optional: Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to supabase storage bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // In real-time this won't automatically update the context immediately unless we refetch or window reload,
      // but it will be available in database.
      toast.success('Display picture updated successfully!');
      window.location.reload(); // Simple way to refresh auth context profile
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to upload display picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account details and security.</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Display Picture
          </CardTitle>
          <CardDescription>
            Upload a profile picture to be used for your outpass and communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-8">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-muted bg-muted flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">{profile?.full_name || 'User'}</h4>
            <p className="text-sm text-muted-foreground">{profile?.department || 'No department assigned'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Profile Details
          </CardTitle>
          <CardDescription>
            Keep your personal information up to date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registerNumber">Register Number / ID</Label>
              <Input
                id="registerNumber"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                placeholder="e.g. 731120104001"
              />
            </div>
            <Button
              type="submit"
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Reset Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Ensure your account is using a long, random password to stay secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-w-md">
            {/* OTP Section */}
            {otpStatus === 'idle' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Old Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={requestOtpFromSuperior}
                  disabled={isRequestingOtp}
                  className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {isRequestingOtp ? 'Requesting OTP...' : 'Forgot password? Request OTP from Superior'}
                </button>
              </div>
            ) : otpStatus === 'requested' ? (
              <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="otpCode">OTP Code from Superior</Label>
                  <div className="flex gap-2">
                    <Input
                      id="otpCode"
                      placeholder="6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                    />
                    <Button 
                      type="button" 
                      onClick={verifyOtp} 
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                    >
                      {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </Button>
                  </div>
                   <p className="text-[10px] text-muted-foreground">The code was sent to your designated superior. It expires in 10 minutes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpStatus('idle')}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Cancel and use old password instead
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                OTP Verified! You can now reset your password.
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isUpdatingPassword || !password || password !== confirmPassword || (otpStatus !== 'verified' && !oldPassword)}
              >
                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {otpStatus === 'verified' ? 'Reset Password' : 'Update Password'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
