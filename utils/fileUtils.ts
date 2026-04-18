/**
 * A utility to force-download a file from a URL.
 * Refined to support Cloudinary fl_attachment:filename for robust cross-origin downloads.
 */
export async function downloadFile(url: string, fileName: string = 'download') {
  try {
    // 1. Sanitize filename (Cloudinary doesn't like spaces/special chars in fl_attachment)
    const cleanFileName = fileName
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '') || 'document';
    
    const extension = url.split('.').pop()?.split('?')[0] || '';
    const finalName = cleanFileName.endsWith(extension) ? cleanFileName : `${cleanFileName}.${extension}`;

    // 2. Cloudinary-specific logic: fl_attachment:filename
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        // If the URL already has some transformations, we need to handle that.
        // We inject fl_attachment:<filename> as a transformation.
        const [transformations, rest] = parts[1].includes('/') 
          ? [parts[1].substring(0, parts[1].indexOf('/')), parts[1].substring(parts[1].indexOf('/'))]
          : ['', '/' + parts[1]];
        
        const newTransform = transformations 
          ? `${transformations},fl_attachment:${cleanFileName}` 
          : `fl_attachment:${cleanFileName}`;
          
        const downloadUrl = `${parts[0]}/upload/${newTransform}${rest}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', finalName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }

    // 3. Fallback: Fetch as blob to bypass CORS/Browser Preview
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blobData = await response.blob();
    const localUrl = window.URL.createObjectURL(blobData);
    
    const link = document.createElement('a');
    link.href = localUrl;
    link.setAttribute('download', finalName);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(localUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Last resort: open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
