// lib/whatsapp-waha.js
const WAHA_URL = process.env.WAHA_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';

// قائمة أرقام المسؤولين
const ADMIN_PHONES = process.env.ADMIN_PHONE 
    ? process.env.ADMIN_PHONE.split(',').map(phone => phone.trim())
    : [
        process.env.ADMIN_PHONE_MAIN,
        process.env.ADMIN_PHONE_SALES,
        process.env.ADMIN_PHONE_WAREHOUSE
    ].filter(Boolean);

// خريطة أكواد الدول
const COUNTRY_CODES = {
    'Egypt': '20', 'مصر': '20', 'EG': '20',
    'Saudi Arabia': '966', 'السعودية': '966', 'SA': '966',
    'United Arab Emirates': '971', 'الإمارات': '971', 'UAE': '971', 'AE': '971',
    'Kuwait': '965', 'الكويت': '965', 'KW': '965',
    'Qatar': '974', 'قطر': '974', 'QA': '974',
    'Bahrain': '973', 'البحرين': '973', 'BH': '973',
    'Oman': '968', 'عمان': '968', 'OM': '968',
    'Jordan': '962', 'الأردن': '962', 'JO': '962',
    'Lebanon': '961', 'لبنان': '961', 'LB': '961',
    'Palestine': '970', 'فلسطين': '970', 'PS': '970',
    'Iraq': '964', 'العراق': '964', 'IQ': '964',
    'Yemen': '967', 'اليمن': '967', 'YE': '967',
    'Syria': '963', 'سوريا': '963', 'SY': '963',
    'Morocco': '212', 'المغرب': '212', 'MA': '212',
    'Algeria': '213', 'الجزائر': '213', 'DZ': '213',
    'Tunisia': '216', 'تونس': '216', 'TN': '216',
    'Libya': '218', 'ليبيا': '218', 'LY': '218',
    'Sudan': '249', 'السودان': '249', 'SD': '249'
};

/**
 * تنسيق رقم الواتساب
 */
function formatWhatsAppNumber(phone, country = null) {
    if (!phone) return null;
    
    let cleaned = phone.replace(/[^\d]/g, '');
    
    if (phone.startsWith('+')) {
        cleaned = phone.substring(1).replace(/[^\d]/g, '');
        return cleaned + '@c.us';
    }
    
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    const knownCountryCodes = Object.values(COUNTRY_CODES);
    const hasCountryCode = knownCountryCodes.some(code => cleaned.startsWith(code));
    
    if (!hasCountryCode && country) {
        const countryCode = COUNTRY_CODES[country];
        if (countryCode) {
            cleaned = countryCode + cleaned;
            console.log(`✓ Added country code ${countryCode} for ${country}`);
        }
    }
    
    return cleaned + '@c.us';
}

/**
 * إرسال رسالة واتساب
 */
export async function sendWhatsAppMessage(phone, message, country = null) {
    if (!WAHA_URL) {
        console.error('❌ WAHA_URL is not configured');
        return { success: false, error: 'WAHA_URL not configured' };
    }

    if (!WAHA_API_KEY) {
        console.error('❌ WAHA_API_KEY is not configured');
        return { success: false, error: 'WAHA_API_KEY not configured' };
    }

    try {
        const formattedPhone = formatWhatsAppNumber(phone, country);
        
        if (!formattedPhone) {
            return { success: false, error: 'Invalid phone number' };
        }

        console.log(`📱 Sending WhatsApp to: ${formattedPhone}`);

        const response = await fetch(`${WAHA_URL}/api/sendText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': WAHA_API_KEY
            },
            body: JSON.stringify({
                session: WAHA_SESSION,
                chatId: formattedPhone,
                text: message
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✓ WhatsApp message sent successfully');
            return { success: true, data };
        } else {
            console.error('✗ Failed to send WhatsApp:', data);
            return { success: false, error: data.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('❌ Error sending WhatsApp message:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إرسال رسالة مع صورة
 */
export async function sendWhatsAppImage(phone, imageUrl, caption, country = null) {
    try {
        const formattedPhone = formatWhatsAppNumber(phone, country);
        
        if (!formattedPhone) {
            return { success: false, error: 'Invalid phone number' };
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': WAHA_API_KEY
        };

        const response = await fetch(`${WAHA_URL}/api/sendImage`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                session: WAHA_SESSION,
                chatId: formattedPhone,
                file: { url: imageUrl },
                caption: caption
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✓ WhatsApp image sent successfully');
            return { success: true, data };
        } else {
            console.error('✗ Failed to send image:', data);
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('❌ Error sending image:', error);
        return { success: false, error: error.message };
    }
}

/**
 * رسالة للعميل عند استلام الطلب
 */
export function getCustomerOrderMessage(order) {
    return `🎉 *شكراً لطلبك من متجرنا!*

${order.firstName} ${order.lastName}
✅ تم استلام طلبك بنجاح

📦 *تفاصيل الطلب:*
━━━━━━━━━━━━━━━
رقم الطلب: *#${order._id.toString().slice(-8)}*
المبلغ الإجمالي: *${order.totalAmount} ر.س*
حالة الدفع: ${order.paid ? '*✅ مدفوع*' : '*⏳ غير مدفوع*'}

📍 *عنوان التوصيل:*
${order.address}
${order.city}, ${order.country}

⏱ سيتم معالجة طلبك وإرساله في أقرب وقت ممكن.

💚 شكراً لثقتك بنا!`;
}

/**
 * رسالة للمسؤول عند وصول طلب جديد
 */
export function getAdminOrderNotification(order) {
    const itemsList = order.items.map((item, index) => {
        const props = Object.entries(item.properties || {})
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ');
        return `  ${index + 1}. *${item.title}*${props ? ` (${props})` : ''}\n     الكمية: ${item.quantity} × ${item.price} ر.س`;
    }).join('\n\n');

    return `🔔 *طلب جديد وصل للتو!*
━━━━━━━━━━━━━━━

👤 *معلومات العميل:*
الاسم: *${order.firstName} ${order.lastName}*
📞 الهاتف: ${order.phone}
📧 البريد: ${order.email}

📦 *المنتجات المطلوبة:*
${itemsList}

💰 *الإجمالي:* ${order.totalAmount} ر.س
💳 *حالة الدفع:* ${order.paid ? '*✅ مدفوع*' : '*⚠️ غير مدفوع*'}
${order.paymentId ? `🔖 معرف الدفع: \`${order.paymentId}\`` : ''}

📍 *عنوان التوصيل:*
${order.address}${order.address2 ? `\n${order.address2}` : ''}
${order.city}, ${order.state || ''} ${order.postalCode}
${order.country}

${order.notes ? `📝 *ملاحظات العميل:*\n_${order.notes}_\n\n` : ''}⏰ *الوقت:* ${new Date().toLocaleString('ar-SA', {
    dateStyle: 'full',
    timeStyle: 'short'
})}

━━━━━━━━━━━━━━━
⚡ يرجى معالجة الطلب في أقرب وقت`;
}

/**
 * إرسال إشعارات للعميل وجميع المسؤولين
 */
export async function sendOrderNotifications(order) {
    const results = {
        customer: { success: false, error: 'Not attempted' },
        admins: []
    };

    // 1. إرسال رسالة للعميل
    if (order.phone) {
        console.log(`📱 Sending notification to customer in ${order.country}...`);
        const customerMessage = getCustomerOrderMessage(order);
        results.customer = await sendWhatsAppMessage(
            order.phone, 
            customerMessage,
            order.country
        );
        
        // إرسال صورة المنتج (اختياري)
        if (results.customer.success && order.items[0]?.image) {
            console.log('📸 Sending product image to customer...');
            await sendWhatsAppImage(
                order.phone,
                order.items[0].image,
                `${order.items[0].title} - طلبك في الطريق 🚚`,
                order.country
            );
        }
    } else {
        console.log('⚠️ No customer phone number provided');
    }

    // 2. إرسال رسالة لجميع المسؤولين
    if (ADMIN_PHONES && ADMIN_PHONES.length > 0) {
        console.log(`📱 Sending notifications to ${ADMIN_PHONES.length} admin(s)...`);
        const adminMessage = getAdminOrderNotification(order);
        
        // إرسال لكل مسؤول على حدة
        for (let i = 0; i < ADMIN_PHONES.length; i++) {
            const adminPhone = ADMIN_PHONES[i];
            if (!adminPhone) continue;
            
            console.log(`  → Sending to admin ${i + 1}: ${adminPhone}`);
            const result = await sendWhatsAppMessage(adminPhone, adminMessage);
            
            results.admins.push({
                phone: adminPhone,
                success: result.success,
                error: result.error
            });
            
            if (result.success) {
                console.log(`  ✓ Admin ${i + 1} notified successfully`);
            } else {
                console.log(`  ✗ Failed to notify admin ${i + 1}: ${result.error}`);
            }
            
            // تأخير صغير بين الرسائل لتجنب Rate Limiting
            if (i < ADMIN_PHONES.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        const successCount = results.admins.filter(r => r.success).length;
        console.log(`✓ Successfully notified ${successCount}/${ADMIN_PHONES.length} admins`);
    } else {
        console.log('⚠️ No admin phone numbers configured');
    }

    return results;
}

/**
 * إرسال تحديث حالة الطلب للعميل
 */
export async function sendOrderStatusUpdate(order, newStatus) {
    const statusEmojis = {
        'pending': '⏳',
        'processing': '⚙️',
        'shipped': '🚚',
        'delivered': '✅',
        'cancelled': '❌'
    };
    
    const statusMessages = {
        'pending': 'قيد التجهيز',
        'processing': 'قيد المعالجة',
        'shipped': 'تم الشحن',
        'delivered': 'تم التوصيل',
        'cancelled': 'ملغي'
    };

    const emoji = statusEmojis[newStatus] || '📦';
    const statusText = statusMessages[newStatus] || newStatus;

    let additionalMessage = '';
    if (newStatus === 'shipped') {
        additionalMessage = '\n\n🚚 طلبك في الطريق إليك! سيصل خلال 24 ساعة.';
    } else if (newStatus === 'delivered') {
        additionalMessage = '\n\n💚 نأمل أن تكون راضياً عن مشترياتك!\nيسعدنا تقييمك للمنتجات 🌟';
    } else if (newStatus === 'cancelled') {
        additionalMessage = '\n\n😔 نأسف لإلغاء طلبك. للاستفسار تواصل معنا.';
    }

    const message = `${emoji} *تحديث حالة طلبك*

رقم الطلب: *#${order._id.toString().slice(-8)}*

الحالة الجديدة: *${statusText}* ${emoji}${additionalMessage}

━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('ar-SA')}`;

    if (order.phone) {
        return await sendWhatsAppMessage(order.phone, message, order.country);
    }
    
    return { success: false, error: 'No phone number' };
}

/**
 * التحقق من حالة اتصال WAHA
 */
export async function checkWAHAStatus() {
    try {
        const headers = {};
        if (WAHA_API_KEY) {
            headers['X-Api-Key'] = WAHA_API_KEY;
        }

        const response = await fetch(`${WAHA_URL}/api/sessions/${WAHA_SESSION}`, {
            headers: headers
        });
        
        const data = await response.json();
        return {
            success: response.ok,
            connected: data.status === 'WORKING',
            data: data,
            adminPhones: ADMIN_PHONES,
            adminCount: ADMIN_PHONES.length
        };
    } catch (error) {
        return {
            success: false,
            connected: false,
            error: error.message,
            adminPhones: ADMIN_PHONES,
            adminCount: ADMIN_PHONES.length
        };
    }
}