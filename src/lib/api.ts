const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function getToken(): string | null {
  return localStorage.getItem('placement_token');
}

function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: { ...getHeaders(!skipAuth), ...(rest.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json() as Promise<T>;
  return res as unknown as Promise<T>;
}

export async function apiDownload(path: string, filename?: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  auth: {
    adminLogin: (username: string, password: string) =>
      apiFetch<{ token: string; role: string }>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      }),
    studentLogin: (username: string, password: string) =>
      apiFetch<{ token: string; role: string; student: import('@/types').Student }>(
        '/api/auth/student/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          skipAuth: true,
        }
      ),
    me: () => apiFetch<{ role: string; student?: import('@/types').Student }>('/api/auth/me'),
  },
  admin: {
    getStudents: () => apiFetch<import('@/types').Student[]>('/api/admin/students'),
    addStudent: (body: { name: string; email: string; department: string; collegeName?: string; cgpa: number }) =>
      apiFetch<{ student: import('@/types').Student; credentials: { username: string; password: string } }>(
        '/api/admin/students',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    updatePlacementStatus: (id: string, placementStatus: 'placed' | 'not_placed') =>
      apiFetch<{ placementStatus: string }>(`/api/admin/students/${id}/placement-status`, {
        method: 'PATCH',
        body: JSON.stringify({ placementStatus }),
      }),
    generateStudentCredentials: (studentId: string) =>
      apiFetch<{ credentials: { username: string; password: string }; message: string }>(
        '/api/admin/generate-credentials',
        { method: 'POST', body: JSON.stringify({ studentId }) }
      ),
    reEvaluateStudent: (id: string) =>
      apiFetch<{ driveId: string; status: string; reasons: string[]; missingSkills: string[] }[]>(
        `/api/admin/students/${id}/re-evaluate`,
        { method: 'POST' }
      ),
    updateEligibility: (studentId: string, driveId: string, status: 'eligible' | 'not_eligible' | 'not_registered') =>
      apiFetch<{ driveId: string; status: string }>(
        `/api/admin/eligibility/${studentId}/${driveId}`,
        { method: 'PUT', body: JSON.stringify({ status }) }
      ),
    getDrives: () => apiFetch<import('@/types').PlacementDrive[]>('/api/admin/drives'),
    addDrive: (body: Omit<import('@/types').PlacementDrive, 'id' | 'createdAt'>) =>
      apiFetch<import('@/types').PlacementDrive>('/api/admin/drives', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    downloadPdfRegistered: () => apiDownload('/api/admin/pdf/registered', 'registered-students.pdf'),
    downloadPdfEligible: (driveId?: string) =>
      apiDownload(
        driveId ? `/api/admin/pdf/eligible?driveId=${driveId}` : '/api/admin/pdf/eligible',
        'eligible-students.pdf'
      ),
    downloadStudentResume: (studentId: string, filename?: string) =>
      apiDownload(`/api/admin/students/${studentId}/resume`, filename || 'resume'),
  },
  student: {
    getProfile: () => apiFetch<import('@/types').Student>('/api/student/profile'),
    updateProfile: (body: { skills?: string[]; certifications?: string[]; isRegistered?: boolean }) =>
      apiFetch<import('@/types').Student>('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    uploadResume: (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      const token = getToken();
      return fetch(`${API_URL}/api/student/resume`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }).then((res) => {
        if (!res.ok) return res.json().then((e) => { throw new Error(e.error || 'Upload failed'); });
        return res.json();
      });
    },
    getDrivesWithEligibility: () =>
      apiFetch<
        (import('@/types').PlacementDrive & {
          eligibility: import('@/types').EligibilityResult;
          registered?: boolean;
        })[]
      >('/api/student/drives-with-eligibility'),
    registerForDrive: (driveId: string) =>
      apiFetch<{ message: string; registered: boolean }>(
        `/api/student/drives/${driveId}/register`,
        { method: 'POST' }
      ),
  },
};

export function setToken(token: string | null) {
  if (token) localStorage.setItem('placement_token', token);
  else localStorage.removeItem('placement_token');
}
