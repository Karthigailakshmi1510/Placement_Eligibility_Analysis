import { useState } from 'react';
import { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Users, GraduationCap } from 'lucide-react';
import StudentCard from './StudentCard';

interface DepartmentCardProps {
  department: string;
  students: Student[];
  onUpdateStudentStatus: (id: string, status: 'placed' | 'not_placed') => void;
  onDownloadResume?: (studentId: string, filename?: string) => Promise<void>;
  onReEvaluate?: (studentId: string) => void;
  onCredentialsGenerated?: () => void;
}

const DepartmentCard = ({ department, students, onUpdateStudentStatus, onDownloadResume, onReEvaluate, onCredentialsGenerated }: DepartmentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const placedCount = students.filter(s => s.placementStatus === 'placed').length;
  const registeredCount = students.filter(s => s.isRegistered).length;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">{department}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {students.length} students
                </Badge>
                <Badge variant="success" className="text-xs">
                  {placedCount} placed
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {registeredCount} registered
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {students.length > 0 ? (
              students.map(student => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  onUpdateStatus={onUpdateStudentStatus}
                  onDownloadResume={onDownloadResume}
                  onReEvaluate={onReEvaluate}
                  onCredentialsGenerated={onCredentialsGenerated}
                />
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No students in this department
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default DepartmentCard;
