import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import ProfileForm from '@/components/student/ProfileForm';
import PlacementDriveCard from '@/components/student/PlacementDriveCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { PlacementDrive } from '@/types';
import { toast } from 'sonner';

type DriveWithEligibility = PlacementDrive & {
  eligibility: { status: string; reasons: string[]; missingSkills: string[]; driveLink?: string };
  registered?: boolean;
};

const StudentDashboard = () => {
  const { currentStudent, setCurrentStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('drives');
  const [drivesWithEligibility, setDrivesWithEligibility] = useState<DriveWithEligibility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.student.getProfile();
      setCurrentStudent({ ...profile, createdAt: new Date(profile.createdAt) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load profile');
    }
  };

  const fetchDrives = async () => {
    try {
      const list = await api.student.getDrivesWithEligibility();
      setDrivesWithEligibility(
        list.map((d) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          deadline: new Date(d.deadline),
          eligibility: d.eligibility || {
            status: 'not_registered',
            reasons: [],
            missingSkills: [],
            driveLink: d.driveLink,
          },
          registered: d.registered,
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForDrive = async (driveId: string) => {
    try {
      await api.student.registerForDrive(driveId);
      toast.success('Registered for drive');
      fetchDrives();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchDrives();
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
  }, [activeTab]);

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const eligibleCount = drivesWithEligibility.filter(
    (d) => d.eligibility?.status === 'eligible'
  ).length;
  const notEligibleCount = drivesWithEligibility.filter(
    (d) => d.eligibility?.status === 'not_eligible'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {currentStudent.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground">
              Manage your profile and explore placement opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{drivesWithEligibility.length}</p>
                  <p className="text-sm text-muted-foreground">Active Drives</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{eligibleCount}</p>
                  <p className="text-sm text-muted-foreground">Eligible For</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{notEligibleCount}</p>
                  <p className="text-sm text-muted-foreground">Not Eligible</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {!currentStudent.isRegistered && (
            <Card className="mb-8 border-warning/50 bg-warning/10">
              <CardContent className="flex items-center gap-4 p-6">
                <AlertCircle className="w-8 h-8 text-warning" />
                <div>
                  <h3 className="font-semibold">Complete Your Registration</h3>
                  <p className="text-sm text-muted-foreground">
                    Please update your profile with skills and certifications. Eligibility is set by admin after you register.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="drives" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Placement Drives
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                My Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="drives" className="animate-fade-up">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {drivesWithEligibility.map((item) => (
                    <PlacementDriveCard
                      key={item.id}
                      drive={item}
                      eligibility={{
                        status: item.eligibility?.status as 'eligible' | 'not_eligible' | 'not_registered',
                        reasons: item.eligibility?.reasons || [],
                        missingSkills: item.eligibility?.missingSkills || [],
                        driveLink: item.eligibility?.driveLink,
                      }}
                      registered={item.registered}
                      onRegister={handleRegisterForDrive}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="profile" className="animate-fade-up">
              <ProfileForm onProfileSaved={fetchProfile} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
