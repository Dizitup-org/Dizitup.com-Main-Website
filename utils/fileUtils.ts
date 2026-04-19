/**
 * Force-download a file from a URL.
 * For Cloudinary URLs, injects fl_attachment flag to trigger browser download.
 * Works correctly for both /image/upload/ and /raw/upload/ resource types.
 */
export async function downloadFile(url: string, fileName: string = 'download') {
  try {
    // Sanitize filename — strip unsafe chars for use as HTML download attribute
    const cleanFileName = fileName
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]/g, '') || 'document';

    // Ensure the filename has the right extension
    const urlExtension = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
    const nameHasExt   = cleanFileName.toLowerCase().endsWith(`.${urlExtension}`);
    const finalName    = nameHasExt ? cleanFileName : `${cleanFileName}.${urlExtension}`;

    // Cloudinary: inject fl_attachment immediately after /upload/
    // Correct format: /upload/fl_attachment/v.../folder/file.pdf
    // ❌ WRONG: /upload/fl_attachment:filename/... (only works for image type)
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', finalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback: fetch as blob (handles non-Cloudinary or CORS-restricted URLs)
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');

    const blobData = await response.blob();
    const localUrl = window.URL.createObjectURL(blobData);

    const link = document.createElement('a');
    link.href = localUrl;
    link.setAttribute('download', finalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(localUrl);

  } catch (error) {
    console.error('Download failed:', error);
    // Last resort: open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

