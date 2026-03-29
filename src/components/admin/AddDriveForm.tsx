import { useState } from 'react';
import { PlacementDrive } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { departments, allSkills } from '@/data/mockData';
import { Plus, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddDriveFormProps {
  onAddDrive: (drive: Omit<PlacementDrive, 'id' | 'createdAt'>) => void;
}

const AddDriveForm = ({ onAddDrive }: AddDriveFormProps) => {
  const [formData, setFormData] = useState({
    companyName: '',
    driveLink: '',
    description: '',
    minCgpa: '',
    salary: '',
    deadline: '',
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.driveLink || !formData.minCgpa || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedSkills.length === 0) {
      toast.error('Please select at least one required skill');
      return;
    }

    if (selectedDepartments.length === 0) {
      toast.error('Please select at least one eligible department');
      return;
    }

    onAddDrive({
      companyName: formData.companyName,
      driveLink: formData.driveLink,
      description: formData.description,
      minCgpa: parseFloat(formData.minCgpa),
      salary: formData.salary,
      deadline: new Date(formData.deadline),
      requiredSkills: selectedSkills,
      eligibleDepartments: selectedDepartments,
    });

    // Reset form
    setFormData({
      companyName: '',
      driveLink: '',
      description: '',
      minCgpa: '',
      salary: '',
      deadline: '',
    });
    setSelectedSkills([]);
    setSelectedDepartments([]);
    toast.success('Placement drive added successfully!');
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="font-display">Add New Placement Drive</CardTitle>
            <CardDescription>Create a new company placement opportunity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g., Google"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveLink">Application Link *</Label>
              <Input
                id="driveLink"
                type="url"
                placeholder="https://..."
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minCgpa">Minimum CGPA *</Label>
              <Input
                id="minCgpa"
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="e.g., 7.5"
                value={formData.minCgpa}
                onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary Package</Label>
              <Input
                id="salary"
                placeholder="e.g., ₹15-20 LPA"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deadline">Application Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role and requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Skills Selection */}
          <div className="space-y-2">
            <Label>Required Skills *</Label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map(skill => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    selectedSkills.includes(skill) 
                      ? '' 
                      : 'hover:bg-primary/10'
                  }`}
                  onClick={() => {
                    setSelectedSkills(prev => 
                      prev.includes(skill) 
                        ? prev.filter(s => s !== skill)
                        : [...prev, skill]
                    );
                  }}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Department Selection */}
          <div className="space-y-2">
            <Label>Eligible Departments *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {departments.map(dept => (
                <label 
                  key={dept} 
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedDepartments.includes(dept)}
                    onCheckedChange={(checked) => {
                      setSelectedDepartments(prev => 
                        checked 
                          ? [...prev, dept]
                          : prev.filter(d => d !== dept)
                      );
                    }}
                  />
                  <span className="text-sm">{dept}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full">
            <Plus className="w-4 h-4" />
            Add Placement Drive
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddDriveForm;
