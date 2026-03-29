import { useState } from 'react';
import { Student } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Mail, Award, FileText, CheckCircle, XCircle, Download, RefreshCw, KeyRound, Eye, EyeOff, Key } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface StudentCardProps {
  student: Student;
  onUpdateStatus: (id: string, status: 'placed' | 'not_placed') => void;
  onDownloadResume?: (studentId: string, filename?: string) => Promise<void>;
  onReEvaluate?: (studentId: string) => void;
  onCredentialsGenerated?: () => void;
}

const StudentCard = ({ student, onUpdateStatus, onDownloadResume, onReEvaluate, onCredentialsGenerated }: StudentCardProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [generating, setGenerating] = useState(false);
  const credsMissing = !student.username || !student.password || student.username === '—' || student.password === '—';

  const handleGenerateCredentials = async () => {
    setGenerating(true);
    try {
      const res = await api.admin.generateStudentCredentials(student.id);
      toast.success(res.message, {
        description: `Username: ${res.credentials.username} | Password: ${res.credentials.password}`,
        duration: 10000,
      });
      onCredentialsGenerated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate credentials');
    } finally {
      setGenerating(false);
    }
  };
  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="hero-gradient text-primary-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{student.name}</h3>
              <Badge 
                variant={student.placementStatus === 'placed' ? 'success' : 'secondary'}
                className="shrink-0"
              >
                {student.placementStatus === 'placed' ? 'Placed' : 'Not Placed'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Mail className="w-3 h-3" />
              <span className="truncate">{student.email}</span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-muted-foreground">
                CGPA: <span className="font-medium text-foreground">{student.cgpa}</span>
              </span>
              {student.isRegistered ? (
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Registered
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Registered
                </Badge>
              )}
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1 mt-3">
              {student.skills.slice(0, 4).map(skill => (
                <Badge key={skill} variant="skill" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {student.skills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{student.skills.length - 4} more
                </Badge>
              )}
            </div>

            {/* Certifications */}
            {student.certifications.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Award className="w-3 h-3" />
                {student.certifications.length} certification(s)
              </div>
            )}

            {/* Login credentials (stored in biodata) */}
            <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <KeyRound className="w-3 h-3" />
                  Login credentials (stored)
                </div>
                {credsMissing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleGenerateCredentials}
                    disabled={generating}
                  >
                    <Key className="w-3 h-3 mr-1" />
                    {generating ? 'Generating...' : 'Generate credentials'}
                  </Button>
                )}
              </div>
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">Username:</span>
                  <Input
                    value={student.username ?? '—'}
                    readOnly
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-16">Password:</span>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={student.password ?? '—'}
                    readOnly
                    className="h-8 text-xs font-mono bg-background"
                  />
                  {(student.password != null && student.password !== '') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Resume indicator & download */}
            {student.resumeUrl && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Resume uploaded
                </span>
                {onDownloadResume && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => onDownloadResume(student.id, `${student.name.replace(/\s+/g, '-')}-resume`).catch((e) => toast.error(e?.message || 'Download failed'))}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="sm"
                variant={student.placementStatus === 'placed' ? 'outline' : 'success'}
                onClick={() => onUpdateStatus(student.id, 'placed')}
                disabled={student.placementStatus === 'placed'}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Mark Placed
              </Button>
              <Button
                size="sm"
                variant={student.placementStatus === 'not_placed' ? 'outline' : 'secondary'}
                onClick={() => onUpdateStatus(student.id, 'not_placed')}
                disabled={student.placementStatus === 'not_placed'}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Mark Not Placed
              </Button>
              {onReEvaluate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReEvaluate(student.id)}
                  title="Re-evaluate eligibility for all drives"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Re-evaluate
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentCard;
