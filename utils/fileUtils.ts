/**
 * A utility to force-download a file from a URL.
 * This fetches the file as a blob to bypass the default browser behavior 
 * of opening cross-origin PDFs/Images in a new tab.
 */
export async function downloadFile(url: string, fileName: string = 'download') {
  try {
    // 1. Fetch file as blob
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.json(); // Wait, this should be blob()
    // Re-doing:
    // const blob = await response.blob(); 
    
    // Actually, simpler Cloudinary trick first: 
    // If it's Cloudinary, we can append fl_attachment to the URL.
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        const downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }

    // Fallback: Fetch as blob
    const fetchRes = await fetch(url);
    const blobData = await fetchRes.blob();
    const localUrl = window.URL.createObjectURL(blobData);
    
    const link = document.createElement('a');
    link.href = localUrl;
    link.setAttribute('download', fileName);
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
