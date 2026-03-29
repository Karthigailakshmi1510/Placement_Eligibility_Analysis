import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { departments, allSkills } from '@/data/mockData';
import { Upload, Plus, X, Save, CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ProfileFormProps {
  onProfileSaved?: () => void;
}

const ProfileForm = ({ onProfileSaved }: ProfileFormProps) => {
  const { currentStudent, updateStudent } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentStudent?.skills || []);
  const [newCertification, setNewCertification] = useState('');
  const [certifications, setCertifications] = useState<string[]>(currentStudent?.certifications || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification)) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  const handleSave = async () => {
    if (!currentStudent) return;
    setSaving(true);
    try {
      const updated = await api.student.updateProfile({
        skills: selectedSkills,
        certifications,
        isRegistered: true,
      });
      updateStudent({
        skills: updated.skills,
        certifications: updated.certifications,
        isRegistered: updated.isRegistered,
      });
      toast.success('Profile updated successfully!');
      onProfileSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.student.uploadResume(file);
      updateStudent({ resumeUrl: '/api/student/resume' });
      toast.success('Resume uploaded');
      onProfileSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!currentStudent) return null;

  return (
    <div className="space-y-6">
      {/* Login credentials first - stored so student can view anytime */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Your login credentials
          </CardTitle>
          <CardDescription>Stored for your reference. Use these to sign in.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={currentStudent.username ?? '—'}
              readOnly
              className="bg-muted font-mono"
              placeholder="Contact admin if missing"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={currentStudent.password ?? '—'}
                readOnly
                className="bg-muted font-mono"
              />
              {(currentStudent.password != null && currentStudent.password !== '') && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword((p) => !p)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              )}
            </div>
            {(!currentStudent.password || currentStudent.password === '') && (
              <p className="text-xs text-muted-foreground">Contact admin for password.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Basic Information</CardTitle>
          <CardDescription>Your basic profile details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={currentStudent.name} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={currentStudent.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select defaultValue={currentStudent.department} disabled>
              <SelectTrigger className="bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>CGPA</Label>
            <Input value={currentStudent.cgpa.toString()} disabled className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Skills</CardTitle>
          <CardDescription>Select all skills you possess</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <Badge
                key={skill}
                variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  selectedSkills.includes(skill)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => handleSkillToggle(skill)}
              >
                {selectedSkills.includes(skill) && <CheckCircle className="w-3 h-3 mr-1" />}
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Certifications</CardTitle>
          <CardDescription>Add your certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter certification name"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
            />
            <Button onClick={handleAddCertification} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <Badge key={cert} variant="secondary" className="gap-1">
                {cert}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleRemoveCertification(cert)}
                />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display">Resume</CardTitle>
          <CardDescription>Upload your resume (PDF or DOC/DOCX, max 5MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleResumeChange}
              disabled={uploading}
            />
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {uploading ? 'Uploading...' : 'Drag and drop your resume here, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF or DOC/DOCX, max 5MB
            </p>
            {currentStudent.resumeUrl && (
              <p className="text-xs text-success mt-2">Resume uploaded</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="hero" size="lg" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileForm;
