import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload PDF to the server
 * Usage: node test/upload-pdf.js path/to/file.pdf [category]
 */
async function uploadPDF(filePath, category = 'general') {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            process.exit(1);
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        // Check if it's a PDF
        if (!fileName.toLowerCase().endsWith('.pdf')) {
            console.error('❌ File must be a PDF');
            process.exit(1);
        }

        console.log(`📤 Uploading: ${fileName}`);
        console.log(`📁 Category: ${category}`);
        console.log(`📏 Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

        // Create form data
        const FormData = (await import('form-data')).default;
        const form = new FormData();
        form.append('document', fileBuffer, {
            filename: fileName,
            contentType: 'application/pdf'
        });
        form.append('category', category);

        // Upload to server
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('http://localhost:5000/api/documents/upload', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const result = await response.json();

        if (response.ok) {
            console.log('\n✅ Upload successful!');
            console.log('\nDocument Details:');
            console.log(`  ID: ${result.data.documentId}`);
            console.log(`  Filename: ${result.data.fileName}`);
            console.log(`  Category: ${result.data.category}`);
            console.log(`  Chunks: ${result.data.chunkCount}`);
            console.log(`  Status: ${result.data.status}`);
            console.log('\n📊 You can now generate emails with this context!');
        } else {
            console.error('\n❌ Upload failed:');
            console.error(result);
        }

    } catch (error) {
        console.error('\n❌ Error uploading PDF:', error.message);
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
📄 PDF Upload Tool

Usage: node test/upload-pdf.js <pdf-path> [category]

Examples:
  node test/upload-pdf.js ./docs/company-info.pdf company_info
  node test/upload-pdf.js C:/Users/Me/app-features.pdf app_info
  node test/upload-pdf.js ../product-details.pdf

Categories:
  - company_info   : Company background, mission, values
  - app_info       : Application features, capabilities
  - product_details: Product specifications, pricing
  - technical      : API docs, integrations
  - recruiting     : Hiring process, benefits
  - general        : Default (auto-detected)
    `);
    process.exit(0);
}

const filePath = args[0];
const category = args[1] || 'general';

uploadPDF(filePath, category);
