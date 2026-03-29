import { PlacementDrive, EligibilityResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Banknote, ExternalLink, CheckCircle, XCircle, AlertCircle, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface PlacementDriveCardProps {
  drive: PlacementDrive;
  eligibility: EligibilityResult;
  registered?: boolean;
  onRegister?: (driveId: string) => void;
}

const PlacementDriveCard = ({ drive, eligibility, registered = false, onRegister }: PlacementDriveCardProps) => {
  const getStatusIcon = () => {
    switch (eligibility.status) {
      case 'eligible':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'not_eligible':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'not_registered':
        return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusBadge = () => {
    switch (eligibility.status) {
      case 'eligible':
        return <Badge variant="success">Eligible</Badge>;
      case 'not_eligible':
        return <Badge variant="destructive">Not Eligible</Badge>;
      case 'not_registered':
        return <Badge variant="warning">Not Registered</Badge>;
    }
  };

  return (
    <Card className={`glass-card transition-all duration-300 hover:shadow-xl ${
      eligibility.status === 'eligible' ? 'ring-2 ring-success/30' : ''
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-xl">{drive.companyName}</CardTitle>
              {drive.salary && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Banknote className="w-4 h-4" />
                  {drive.salary}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{drive.description}</p>

        {/* Requirements */}
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Minimum CGPA
            </span>
            <p className="text-sm font-medium">{drive.minCgpa}</p>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Required Skills
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {drive.requiredSkills.map(skill => (
                <Badge 
                  key={skill} 
                  variant={eligibility.missingSkills.includes(skill) ? 'destructive' : 'skill'}
                  className="text-xs"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Eligible Departments
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {drive.eligibleDepartments.map(dept => (
                <Badge key={dept} variant="department" className="text-xs">
                  {dept}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Deadline: {format(new Date(drive.deadline), 'MMM dd, yyyy')}
          </div>
        </div>

        {/* Eligibility Message */}
        {eligibility.status !== 'eligible' && (
          <div className={`p-3 rounded-lg ${
            eligibility.status === 'not_eligible' 
              ? 'bg-destructive/10 text-destructive' 
              : 'bg-warning/10 text-warning'
          }`}>
            <p className="text-sm font-medium mb-1">
              {eligibility.status === 'not_eligible' ? 'Reason(s) for ineligibility:' : 'Action Required:'}
            </p>
            <ul className="text-sm space-y-1">
              {eligibility.reasons.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Register button: show for all drives so student can register for company */}
        <div className="flex flex-col gap-2 mt-4">
          {registered ? (
            <Badge variant="success" className="w-full justify-center py-2 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Registered for this drive
            </Badge>
          ) : (
            onRegister && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => onRegister(drive.id)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </Button>
            )
          )}
          {eligibility.status === 'eligible' && (
              <Button
                variant="success"
                className="w-full"
                onClick={() => {
                  const url = drive.driveLink?.startsWith('http') ? drive.driveLink : `${window.location.origin}${drive.driveLink?.startsWith('/') ? drive.driveLink : '/' + drive.driveLink}`;
                  window.open(url, '_blank');
                }}
              >
                Apply Now
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlacementDriveCard;
