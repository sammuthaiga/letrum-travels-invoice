// Invoice Management System - Fixed Complete JavaScript Functionality

// Global variables
let signaturePad = null;
let hasSignature = false;
let providerSignatureDataUrl = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeInvoice();
    setupEventListeners();
    loadSavedData();
    setupKeyboardShortcuts();
});

// Main initialization function
function initializeInvoice() {
    initSignaturePad();
    createProviderSignatureImage();
    setDefaultDate();
    updateCompanyDisplay();
    resizeCanvasForMobile();
}

// Initialize signature pad
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    // Set canvas dimensions based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    if (containerWidth < 450) {
        canvas.width = Math.min(containerWidth - 40, 360);
        canvas.height = 120;
    } else {
        canvas.width = 400;
        canvas.height = 150;
    }
    
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5,
        onBegin: function() {
            const placeholder = document.getElementById('signaturePlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }
    });
}

// Create provider signature programmatically
function createProviderSignatureImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    
    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style the signature
    ctx.fillStyle = '#0b3d0b';
    ctx.font = '48px "Brush Script MT", "Lucida Handwriting", cursive';
    ctx.textBaseline = 'middle';
    
    // Draw name
    const name = 'Cliff Okiko';
    const textWidth = ctx.measureText(name).width;
    ctx.fillText(name, (canvas.width - textWidth) / 2, canvas.height / 2 + 10);
    
    // Add decorative underline
    ctx.strokeStyle = 'rgba(11,61,11,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo((canvas.width - textWidth) / 2 + 10, canvas.height / 2 + 30);
    ctx.quadraticCurveTo(
        canvas.width / 2, 
        canvas.height / 2 + 50, 
        (canvas.width + textWidth) / 2 - 10, 
        canvas.height / 2 + 30
    );
    ctx.stroke();
    
    // Save as data URL
    providerSignatureDataUrl = canvas.toDataURL('image/png');
    
    // Display in provider signature area
    const img = document.getElementById('providerSignatureImg');
    if (img) {
        img.src = providerSignatureDataUrl;
        img.style.display = 'block';
    }
}

// Set default dates
function setDefaultDate() {
    const clientDateInput = document.getElementById('clientDate');
    if (clientDateInput) {
        clientDateInput.valueAsDate = new Date();
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Company name auto-update
    const companyInput = document.getElementById('clientCompany');
    if (companyInput) {
        companyInput.addEventListener('input', updateCompanyDisplay);
    }
    
    // Window resize handler
    window.addEventListener('resize', debounce(resizeCanvasForMobile, 250));
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvasForMobile, 200);
    });
}

// Update company display in signature section
function updateCompanyDisplay() {
    const companyInput = document.getElementById('clientCompany');
    const displayElement = document.getElementById('displayClientCompany');
    
    if (companyInput && displayElement) {
        displayElement.textContent = companyInput.value || 'Letrum Agencies';
    }
}

// Clear signature function
function clearSignature() {
    if (signaturePad) {
        signaturePad.clear();
        hasSignature = false;
        
        const clientImg = document.getElementById('clientSignatureImg');
        const placeholder = document.getElementById('signaturePlaceholder');
        
        if (clientImg) {
            clientImg.style.display = 'none';
        }
        if (placeholder) {
            placeholder.style.display = 'inline';
        }
        
        showStatus('Signature cleared', 'success');
    }
}

// Save signature function
function saveSignature() {
    if (!signaturePad || signaturePad.isEmpty()) {
        showStatus('Please provide a signature first', 'warning');
        return;
    }
    
    hasSignature = true;
    const signatureImage = signaturePad.toDataURL();
    
    // Display signature
    const clientImg = document.getElementById('clientSignatureImg');
    const placeholder = document.getElementById('signaturePlaceholder');
    
    if (clientImg) {
        clientImg.src = signatureImage;
        clientImg.style.display = 'block';
    }
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Save to localStorage
    saveDataToStorage();
    showStatus('Signature saved successfully!', 'success');
}

// FINAL FIXED PDF Generation - Direct DOM replacement approach
function generatePDF() {
    const clientCompany = document.getElementById('clientCompany').value || 'Client';
    showStatus('📄 Generating PDF... Please wait...', 'warning');

    // Get the original container
    const original = document.querySelector('.container');
    if (!original) {
        showStatus('❌ Error: Could not find invoice content', 'error');
        return;
    }

    // Save current scroll position and original parent
    const currentScrollY = window.scrollY;
    const originalParent = original.parentNode;
    const originalNextSibling = original.nextSibling;
    
    // Clone the content for PDF generation
    const clone = original.cloneNode(true);
    
    // Prepare the clone for PDF
    preparePDFContent(clone);
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'pdf-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 10px;
        text-align: center;
        font-size: 18px;
        color: #333;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    loadingMsg.innerHTML = `
        <div style="margin-bottom: 20px;">
            <strong>Generating Your Invoice PDF</strong>
        </div>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
            This will take just a moment...
        </div>
        <div style="margin: 0 auto; width: 250px; height: 6px; background: #eee; border-radius: 3px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #7fb069, #8fc079); animation: shimmer 1.5s ease-in-out infinite;"></div>
        </div>
        <style>
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;
    overlay.appendChild(loadingMsg);
    document.body.appendChild(overlay);
    
    // Temporarily hide the original and show the clone in its place
    original.style.display = 'none';
    
    // Insert clone in place of original
    originalParent.insertBefore(clone, originalNextSibling);
    
    // Apply PDF-ready styles to clone
    clone.style.cssText = `
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
        background: white;
        box-shadow: none;
        border-radius: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #000;
        position: relative;
    `;
    
    // Force browser to render
    clone.offsetHeight;
    
    // Scroll to top to ensure full capture
    window.scrollTo(0, 0);
    
    // Wait a moment for rendering to complete
    setTimeout(() => {
        // Configure html2pdf options
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Invoice_${clientCompany.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`,
            image: {
                type: 'jpeg',
                quality: 0.98
            },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: -window.scrollY,
                windowWidth: document.documentElement.scrollWidth,
                windowHeight: document.documentElement.scrollHeight
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: {
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after'
            }
        };

        html2pdf().set(opt).from(clone).save().then(() => {
            showStatus('✅ PDF downloaded successfully!', 'success');
        }).catch(() => {
            showStatus('❌ PDF generation failed!', 'error');
        }).finally(() => {
            // Remove overlay and restore original
            document.body.removeChild(overlay);
            clone.remove();
            original.style.display = '';
            window.scrollTo(0, currentScrollY);
        });
    }, 600);
}

// Helper function to prepare content for PDF
function preparePDFContent(clone) {
    // Remove non-printable elements
    const elementsToRemove = clone.querySelectorAll(
        '.no-print, .action-buttons, .signature-section-digital, .signature-controls, button, .status-message'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // Fix all input fields to show their values
    const inputs = clone.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        const originalInput = document.querySelector(`#${input.id}`);
        if (originalInput) {
            const value = originalInput.value;
            if (input.type === 'date') {
                // Create a text span to replace the date input
                const span = document.createElement('span');
                span.textContent = value || new Date().toISOString().slice(0, 10);
                span.style.cssText = 'border-bottom: 1px solid #333; padding: 2px 0;';
                input.parentNode.replaceChild(span, input);
            } else {
                // Create a text span to replace other inputs
                const span = document.createElement('span');
                span.textContent = value || '';
                span.style.cssText = 'border-bottom: 1px solid #333; padding: 2px 0; display: inline-block; min-width: 200px;';
                input.parentNode.replaceChild(span, input);
            }
        }
    });
    
    // Add signatures if they exist
    if (providerSignatureDataUrl) {
        const provImg = clone.querySelector('#providerSignatureImg');
        if (provImg) {
            provImg.src = providerSignatureDataUrl;
            provImg.style.cssText = 'display: block; max-height: 60px; max-width: 200px; margin: 10px auto;';
        }
    }
    
    if (hasSignature && signaturePad) {
        const clientImg = clone.querySelector('#clientSignatureImg');
        if (clientImg) {
            clientImg.src = signaturePad.toDataURL();
            clientImg.style.cssText = 'display: block; max-height: 60px; max-width: 200px; margin: 10px auto;';
        }
        const placeholder = clone.querySelector('#signaturePlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }
    
    // Apply styles to ensure proper rendering
    clone.style.cssText = `
        width: 100%;
        max-width: 794px;
        padding: 20px;
        background: white;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        font-size: 12px;
        line-height: 1.5;
        color: #000;
    `;
    
    // Fix tables for better PDF rendering
    const tables = clone.querySelectorAll('.cost-table, .timeline-table');
    tables.forEach(table => {
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
            page-break-inside: avoid;
        `;
        
        // Fix headers
        const headers = table.querySelectorAll('th');
        headers.forEach(th => {
            th.style.cssText = `
                background: #7fb069 !important;
                color: #000 !important;
                padding: 8px 4px;
                font-size: 9px;
                border: 1px solid #ddd;
                font-weight: bold;
            `;
        });
        
        // Fix cells
        const cells = table.querySelectorAll('td');
        cells.forEach(td => {
            td.style.cssText = `
                padding: 6px 4px;
                border: 1px solid #ddd;
                font-size: 9px;
                color: #000;
            `;
        });
    });
    
    // Ensure all sections are visible
    const sections = clone.querySelectorAll('section, .footer');
    sections.forEach(section => {
        section.style.pageBreakInside = 'avoid';
        section.style.display = 'block';
        section.style.visibility = 'visible';
    });
}

// Print invoice function
function printInvoice() {
    // Validate before printing
    const validationResult = validateFields();
    if (!validationResult.isValid) {
        showStatus(validationResult.message, 'error');
        document.getElementById(validationResult.focusField).focus();
        return;
    }
    
    if (!hasSignature) {
        showStatus('⚠️ Please add your digital signature before printing', 'warning');
        return;
    }
    
    // Save data before printing
    saveDataToStorage();
    
    showStatus('🖨️ Opening print dialog...', 'success');
    
    // Use a small delay to ensure status message shows
    setTimeout(() => {
        window.print();
    }, 100);
}

// Main download and email function
function downloadAndEmail() {
    // Validate required fields
    const validationResult = validateFields();
    if (!validationResult.isValid) {
        showStatus(validationResult.message, 'error');
        document.getElementById(validationResult.focusField).focus();
        return;
    }

    if (!hasSignature) {
        showStatus('⚠️ Please add your digital signature before proceeding', 'error');
        return;
    }

    showStatus('⚡ Generating your signed invoice PDF...', 'warning');
    
    // Save data first
    saveDataToStorage();

    // Generate PDF
    generatePDF();

    // Wait for PDF generation to start, then open email
    setTimeout(() => {
        openEmailClient();
        showStatus('✅ PDF generated! Email opened! Please attach the downloaded PDF.', 'success');
    }, 3000); // Give more time for PDF generation to start
}

// Validate form fields
function validateFields() {
    const fields = {
        clientCompany: 'company name',
        clientEmail: 'email address',
        clientAddress: 'company address',
        clientPhone: 'phone number'
    };
    
    for (const [fieldId, fieldName] of Object.entries(fields)) {
        const field = document.getElementById(fieldId);
        if (!field) continue;
        
        const value = field.value.trim();
        if (!value) {
            return {
                isValid: false,
                message: `⚠️ Please enter your ${fieldName}`,
                focusField: fieldId
            };
        }
    }
    
    // Validate email format
    const email = document.getElementById('clientEmail').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            message: '⚠️ Please enter a valid email address',
            focusField: 'clientEmail'
        };
    }
    
    return { isValid: true };
}

// Open email client with pre-filled content
function openEmailClient() {
    const clientCompany = document.getElementById('clientCompany').value || 'Company';
    const clientEmail = document.getElementById('clientEmail').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const clientPhone = document.getElementById('clientPhone').value;
    
    const recipients = 'cliff.okiko@gmail.com,muthaigasam222@gmail.com';
    const subject = `✅ SIGNED INVOICE - ${clientCompany} - Letrum Travel Platform Development`;
    const currentURL = window.location.href;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const bodyContent = `Dear Cliff Okiko,

I have completed and digitally signed the invoice for the Letrum Travel Platform development project.

📋 CLIENT DETAILS:
Company: ${clientCompany}
Email: ${clientEmail}
Address: ${clientAddress}
Phone: ${clientPhone}

📄 INVOICE DETAILS:
Invoice Number: KG-LTR-2025-001
Total Amount: KSH 180,000
Signed Date: ${new Date().toLocaleDateString()}

💰 PAYMENT SCHEDULE AGREED:
✅ 50% (KSH 90,000) - Upon contract signing - READY TO PAY
⏳ 30% (KSH 54,000) - Frontend completion demo
⏳ 20% (KSH 36,000) - Live deployment

📎 SIGNED INVOICE:
I have downloaded the signed PDF invoice and will attach it to this email.
Original Invoice Link: ${currentURL}
Reference ID: INV-${timestamp}

🚀 NEXT STEPS:
1. Invoice signed and attached
2. Ready to send KSH 90,000 deposit to 0792867928
3. Ready to begin 6-week development timeline
4. Excited to start this project!

📞 PAYMENT CONFIRMATION:
Our preferred payment method is MPESA to: 0792867928
Bank details available on request.

This invoice has been digitally signed and approved. Please proceed with the project as outlined.

Best regards,
${clientCompany}

---
📧 Auto-generated from signed invoice system
🔗 Original form: ${currentURL}
📅 Generated: ${new Date().toLocaleString()}`;
    
    // Properly encode for mailto
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyContent);
    
    // Create mailto URL
    const mailto = `mailto:${recipients}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Open email client
    window.location.href = mailto;
}

// Show status message
function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 5 seconds (increased for important messages)
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// Save data to localStorage
function saveDataToStorage() {
    const data = {
        company: document.getElementById('clientCompany').value,
        address: document.getElementById('clientAddress').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        date: document.getElementById('clientDate').value,
        signature: hasSignature && signaturePad ? signaturePad.toDataURL() : null,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('letrum_invoice_data', JSON.stringify(data));
}

// Load saved data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('letrum_invoice_data');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Fill form fields
        if (data.company) document.getElementById('clientCompany').value = data.company;
        if (data.address) document.getElementById('clientAddress').value = data.address;
        if (data.email) document.getElementById('clientEmail').value = data.email;
        if (data.phone) document.getElementById('clientPhone').value = data.phone;
        if (data.date) document.getElementById('clientDate').value = data.date;
        
        // Load signature if exists
        if (data.signature && signaturePad) {
            // Small delay to ensure canvas is ready
            setTimeout(() => {
                signaturePad.fromDataURL(data.signature);
                hasSignature = true;
                
                const clientImg = document.getElementById('clientSignatureImg');
                const placeholder = document.getElementById('signaturePlaceholder');
                
                if (clientImg) {
                    clientImg.src = data.signature;
                    clientImg.style.display = 'block';
                }
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            }, 100);
        }
        
        // Update company display
        updateCompanyDisplay();
        
        showStatus('Previous data loaded successfully!', 'success');
    } catch (err) {
        console.error('Error loading saved data:', err);
    }
}

// Reset form function
function resetForm() {
    if (!confirm('Are you sure you want to reset all fields? This will clear all entered data.')) {
        return;
    }
    
    // Clear all input fields
    document.getElementById('clientCompany').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientDate').valueAsDate = new Date();
    
    // Clear signature
    clearSignature();
    
    // Update display
    updateCompanyDisplay();
    
    // Clear saved data
    localStorage.removeItem('letrum_invoice_data');
    
    showStatus('Form reset successfully!', 'success');
}

// Resize canvas for mobile devices
function resizeCanvasForMobile() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas || !signaturePad) return;
    
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    // Save signature data if exists
    const signatureData = hasSignature ? signaturePad.toDataURL() : null;
    
    // Resize canvas
    if (containerWidth < 450) {
        canvas.width = Math.min(containerWidth - 40, 360);
        canvas.height = 120;
    } else {
        canvas.width = 400;
        canvas.height = 150;
    }
    
    // Reinitialize signature pad
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5
    });
    
    // Restore signature if it existed
    if (signatureData && hasSignature) {
        signaturePad.fromDataURL(signatureData);
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'p':
                    e.preventDefault();
                    printInvoice();
                    break;
                case 's':
                    e.preventDefault();
                    saveDataToStorage();
                    showStatus('Data saved successfully!', 'success');
                    break;
                case 'r':
                    e.preventDefault();
                    resetForm();
                    break;
                case 'd':
                    e.preventDefault();
                    generatePDF();
                    break;
                case 'e':
                    e.preventDefault();
                    downloadAndEmail();
                    break;
            }
        }
    });
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save form data on input
document.addEventListener('input', debounce(function(e) {
    if (e.target.classList.contains('editable-field')) {
        saveDataToStorage();
    }
}, 1000));

// Handle visibility change to save state
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        saveDataToStorage();
    }
});

// Save before page unload
window.addEventListener('beforeunload', function() {
    saveDataToStorage();
});

// Expose functions to global scope for HTML onclick handlers
window.clearSignature = clearSignature;
window.saveSignature = saveSignature;
window.generatePDF = generatePDF;
window.printInvoice = printInvoice;
window.downloadAndEmail = downloadAndEmail;
window.resetForm = resetForm;