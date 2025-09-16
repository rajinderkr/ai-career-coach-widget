// These will be available globally from the CDN scripts in index.html
declare const pdfjsLib: any;
declare const mammoth: any;

// Set up pdf.js worker. It's required for the library to work.
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
}

const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    const timeout = new Promise<T>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error(errorMessage));
        }, ms);
    });
    return Promise.race([promise, timeout]);
};

const extractPdfText = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Defensively wrap the library's promise in a native Promise. This ensures it's a 
        // standard, well-behaved promise that will work correctly with our timeout mechanism,
        // preventing silent hangs if the external library fails to resolve or reject.
        const pdf = await new Promise((resolve, reject) => {
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            loadingTask.promise.then(resolve, reject);
        });

        const typedPdf = pdf as any; // Cast to access properties
        if (!typedPdf || typedPdf.numPages === 0) {
            return '';
        }

        let textContent = '';
        for (let i = 1; i <= typedPdf.numPages; i++) {
            const page = await typedPdf.getPage(i);
            const text = await page.getTextContent();
            if (text && text.items) {
                textContent += text.items.map((item: any) => item.str).join(' ') + '\n';
            }
        }
        return textContent;
    } catch (error) {
        console.error('Error during PDF text extraction:', error);
        // Overhauled error handling to be more robust and not rely on `instanceof Error`.
        // This allows us to catch non-standard errors thrown by the library.
        const errorName = (error as any)?.name;
        const errorMessage = (error as any)?.message;

        if (errorName === 'PasswordException' || (errorMessage && errorMessage.toLowerCase().includes('password'))) {
            throw new Error('This PDF is password-protected and cannot be read.');
        }
        if (errorName === 'InvalidPDFException' || (errorMessage && errorMessage.includes('Invalid PDF structure'))) {
            throw new Error('This appears to be an invalid or corrupted PDF file.');
        }
        // Provide more details in the generic error message for better diagnostics.
        throw new Error(`An unexpected error occurred while reading the PDF file. Details: ${errorMessage || 'Unknown PDF error'}`);
    }
};


const extractWordText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
};

const extractPlainText = async (file: File): Promise<string> => {
    return file.text();
};


export const extractTextFromResume = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const TIMEOUT_MS = 15000; // 15 seconds timeout for file processing

    if (fileExtension === 'pdf') {
        if (typeof pdfjsLib === 'undefined' || !pdfjsLib.getDocument) {
            throw new Error('The PDF processing library failed to load. Please check your network connection and refresh the page.');
        }
        return await withTimeout(
            extractPdfText(file),
            TIMEOUT_MS,
            'PDF processing timed out. The file might be corrupted or too complex.'
        );
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        if (typeof mammoth === 'undefined' || !mammoth.extractRawText) {
            throw new Error('The Word document processing library failed to load. Please check your network connection and refresh the page.');
        }
        try {
            return await withTimeout(
                extractWordText(file),
                TIMEOUT_MS,
                'Word document processing timed out. The file may be too large or corrupted.'
            );
        } catch (e) {
             if (fileExtension === 'doc' && e instanceof Error && !e.message.includes('timed out')) {
                console.error("Could not read .doc file. It might be in an unsupported format.", e);
                throw new Error("Could not read this .doc file. Please convert it to .docx or .pdf for best results.");
            }
            throw e; // re-throw timeout errors or other mammoth.js errors
        }
    } else if (fileExtension === 'txt') {
        return await withTimeout(
            extractPlainText(file),
            TIMEOUT_MS,
            'Text file processing timed out. The file may be too large.'
        );
    } else {
        throw new Error('Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.');
    }
};