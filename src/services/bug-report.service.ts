import apiClient from './api-client';

export interface BugReportPayload {
  title: string;
  description: string;
  category: string;
  severity: string;
  device_info: string;
  role: string;
  attachment?: {
    uri: string;
    name: string;
    type: string;
  };
  [key: string]: any;
}

export const submitBugReport = async (payload: BugReportPayload) => {
  try {
    const formData = new FormData();
    
    // Sanitize and append fields
    formData.append('title', payload.title.trim());
    formData.append('category', payload.category);
    formData.append('severity', payload.severity);
    
    // Include device info and role in the description for visibility
    const fullDescription = `${payload.description.trim()}\n\n---\nDevice Info: ${payload.device_info}\nRole: ${payload.role}`;
    formData.append('description', fullDescription);

    // Securely handle attachment
    if (payload.attachment) {
      // Validate file type (Sanitization/Validation)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
      if (!allowedTypes.includes(payload.attachment.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WEBP and PDF are allowed.');
      }

      formData.append('attachment', {
        uri: payload.attachment.uri,
        name: payload.attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_'), // Sanitize filename
        type: payload.attachment.type,
      } as any);
    }

    // Correct endpoint based on latest backend changes: api/bug-reports/reports/
    const response = await apiClient.post('bug-reports/reports/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('[BugReport] Dedicated endpoint failed:', error);
    
    // Fallback to general contact endpoint if dedicated fails (JSON only)
    console.warn('[BugReport] Falling back to general contact');
    const fallbackPayload = {
      subject: `[Bug Report] ${payload.title}`,
      message: `Category: ${payload.category}\nSeverity: ${payload.severity}\nRole: ${payload.role}\nDevice: ${payload.device_info}\n\n${payload.description}`,
      // Note: Contact API usually doesn't support attachments in this app's current form
    };
    
    const response = await apiClient.post('users/contact/', fallbackPayload);
    return response.data;
  }
};
