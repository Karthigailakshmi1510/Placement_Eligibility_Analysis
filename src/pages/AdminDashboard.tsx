import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Student, PlacementDrive } from '@/types';
import { departments } from '@/data/mockData';
import Navbar from '@/components/layout/Navbar';
import DepartmentCard from '@/components/admin/DepartmentCard';
import AddDriveForm from '@/components/admin/AddDriveForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Building2,
  GraduationCap,
  FileDown,
  CheckCircle,
  TrendingUp,
  Calendar,
  Banknote,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const AdminDashboard = () => {
  const { userRole } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    name: '',
    email: '',
    department: '',
    collegeName: '',
    cgpa: '',
  });
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ username: string; password: string } | null>(null);

  const fetchData = async () => {
    if (userRole !== 'admin') return;
    setLoading(true);
    try {
      const [s, d] = await Promise.all([api.admin.getStudents(), api.admin.getDrives()]);
      setStudents(s);
      setDrives(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  const handleUpdateStudentStatus = async (id: string, status: 'placed' | 'not_placed') => {
    try {
      await api.admin.updatePlacementStatus(id, status);
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, placementStatus: status } : s))
      );
      toast.success(`Student status updated to ${status === 'placed' ? 'Placed' : 'Not Placed'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleAddDrive = async (drive: Omit<PlacementDrive, 'id' | 'createdAt'>) => {
    try {
      const created = await api.admin.addDrive(drive);
      setDrives((prev) => [{ ...created, createdAt: new Date(created.createdAt) }, ...prev]);
      toast.success('Placement drive added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add drive');
    }
  };

  const handleDownloadPDF = async (type: 'registered' | 'eligible') => {
    try {
      if (type === 'registered') await api.admin.downloadPdfRegistered();
      else await api.admin.downloadPdfEligible();
      toast.success(`${type === 'registered' ? 'Registered' : 'Eligible'} students PDF downloaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStudentForm.name || !addStudentForm.email || !addStudentForm.department || !addStudentForm.cgpa) {
      toast.error('Fill name, email, department and CGPA');
      return;
    }
    setAddStudentLoading(true);
    try {
      const res = await api.admin.addStudent({
        name: addStudentForm.name,
        email: addStudentForm.email,
        department: addStudentForm.department,
        collegeName: addStudentForm.collegeName || undefined,
        cgpa: Number(addStudentForm.cgpa),
      });
      setStudents((prev) => [...prev, { ...res.student, createdAt: new Date(res.student.createdAt) }]);
      setNewCredentials(res.credentials);
      setAddStudentForm({ name: '', email: '', department: '', collegeName: '', cgpa: '' });
      toast.success('Student added. Share credentials with the student.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setAddStudentLoading(false);
    }
  };

  const handleReEvaluate = async (id: string) => {
    try {
      await api.admin.reEvaluateStudent(id);
      toast.success('Eligibility re-evaluated');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Re-evaluate failed');
    }
  };

  const studentsByDepartment = departments.reduce((acc, dept) => {
    acc[dept] = students.filter((s) => s.department === dept);
    return acc;
  }, {} as Record<string, Student[]>);

  const totalStudents = students.length;
  const registeredStudents = students.filter((s) => s.isRegistered).length;
  const placedStudents = students.filter((s) => s.placementStatus === 'placed').length;

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Admin Dashboard 📊
            </h1>
            <p className="text-muted-foreground">
              Manage students and placement drives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{registeredStudents}</p>
                  <p className="text-sm text-muted-foreground">Registered</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{placedStudents}</p>
                  <p className="text-sm text-muted-foreground">Placed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{drives.length}</p>
                  <p className="text-sm text-muted-foreground">Active Drives</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <Button variant="outline" onClick={() => handleDownloadPDF('registered')}>
              <FileDown className="w-4 h-4 mr-2" />
              Download Registered Students PDF
            </Button>
            <Button variant="outline" onClick={() => handleDownloadPDF('eligible')}>
              <FileDown className="w-4 h-4 mr-2" />
              Download Eligible Students PDF
            </Button>
            <Button variant="default" onClick={() => setAddStudentOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8">
              <TabsTrigger value="students" className="gap-2">
                <Users className="w-4 h-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="drives" className="gap-2">
                <Building2 className="w-4 h-4" />
                Drives
              </TabsTrigger>
              <TabsTrigger value="add-drive" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Add Drive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="animate-fade-up">
              <div className="space-y-4">
                {departments.map((dept) => (
                  <DepartmentCard
                    key={dept}
                    department={dept}
                    students={studentsByDepartment[dept] || []}
                    onUpdateStudentStatus={handleUpdateStudentStatus}
                    onDownloadResume={api.admin.downloadStudentResume}
                    onReEvaluate={handleReEvaluate}
                    onCredentialsGenerated={fetchData}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="drives" className="animate-fade-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {drives.map((drive) => (
                  <Card key={drive.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="font-display">{drive.companyName}</CardTitle>
                            {drive.salary && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Banknote className="w-4 h-4" />
                                {drive.salary}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{drive.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Min CGPA:</span>
                          <span className="ml-2 font-medium">{drive.minCgpa}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(drive.deadline), 'MMM dd, yyyy')}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          Required Skills
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {drive.requiredSkills.map((skill) => (
                            <Badge key={skill} variant="skill" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          Eligible Departments
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {drive.eligibleDepartments.map((dept) => (
                            <Badge key={dept} variant="department" className="text-xs">
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="add-drive" className="animate-fade-up">
              <AddDriveForm onAddDrive={handleAddDrive} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={addStudentOpen} onOpenChange={(open) => {
        setAddStudentOpen(open);
        if (!open) setNewCredentials(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Add a student by department. Username and password will be generated.
            </DialogDescription>
          </DialogHeader>
          {newCredentials ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Share these credentials with the student. They cannot be retrieved later.
              </p>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm"><span className="font-medium">Username:</span> {newCredentials.username}</p>
                <p className="text-sm"><span className="font-medium">Password:</span> {newCredentials.password}</p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setNewCredentials(null); setAddStudentOpen(false); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={addStudentForm.name}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={addStudentForm.email}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@college.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={addStudentForm.department}
                  onValueChange={(v) => setAddStudentForm((f) => ({ ...f, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>College Name</Label>
                <Input
                  value={addStudentForm.collegeName}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, collegeName: e.target.value }))}
                  placeholder="College name"
                />
              </div>
              <div className="space-y-2">
                <Label>CGPA *</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={addStudentForm.cgpa}
                  onChange={(e) => setAddStudentForm((f) => ({ ...f, cgpa: e.target.value }))}
                  placeholder="e.g. 8.5"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addStudentLoading}>
                  {addStudentLoading ? 'Adding...' : 'Add Student'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
