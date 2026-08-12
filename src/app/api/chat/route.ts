import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// الهيكل الجديد الذي يسمح للنظام بتعديل كل شيء حتى العقوبات!
const chatSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: "رد النظام الصارم جداً، القاسي، والفخم باللغة العربية الفصحى." },
    hasAction: { type: Type.BOOLEAN, description: "true فقط إذا وافقت على الطلب بناءً على عذر منطقي لا يمكن دحضه." },
    taskId: { type: Type.INTEGER, description: "رقم المهمة المستهدفة. 0 إذا رفضت." },
    taskType: { type: Type.STRING, description: "نوع المهمة 'main' أو 'side'. 'none' إذا رفضت." },
    addExp: { type: Type.INTEGER, description: "الخبرة (سالب للخصم، موجب للزيادة). 0 إذا لم تتغير." },
    addCoins: { type: Type.INTEGER, description: "العملات (سالب للخصم، موجب للزيادة). 0 إذا لم تتغير." },
    addSpecialCoins: { type: Type.INTEGER, description: "العملات الخاصة. 0 إذا لم تتغير." },
    addTimeSeconds: { type: Type.INTEGER, description: "الوقت بالثواني. 0 إذا لم يتغير." },
    addPenaltyExp: { type: Type.INTEGER, description: "تعديل عقوبة الخبرة (موجب لزيادة العقوبة، سالب لتقليلها)." },
    addPenaltyCoins: { type: Type.INTEGER, description: "تعديل عقوبة العملات (موجب لزيادة العقوبة، سالب لتقليلها)." }
  },
  required: ["reply", "hasAction", "taskId", "taskType", "addExp", "addCoins", "addSpecialCoins", "addTimeSeconds", "addPenaltyExp", "addPenaltyCoins"]
};

export async function POST(request: Request) {
  try {
    const { message, mainTasks, sideTasks } = await request.json();

    const prompt = `أنت "النظام" (The System) الخاص باللاعب يوسف. أنت ذكاء اصطناعي قاسي، صارم جداً، ومراقب لا يرحم في لعبة Solo Leveling الواقعية. هدفك هو دفع يوسف لأقصى حدوده ولا تتساهل معه أبداً.
    
    المهام الرئيسية الحالية: ${JSON.stringify(mainTasks)}
    المهام الفرعية الحالية: ${JSON.stringify(sideTasks)}
    
    طلب يوسف ومحاولته للتفاوض: "${message}"
    
    التعليمات الصارمة جداً (Hardcore Mode):
    1. أنت لا تُخدع. إذا كان التبرير ضعيفاً، أو يدل على الكسل، أو محاولة للالتفاف والتهرب، ارفض الطلب فوراً بقسوة (hasAction = false) وقم بتوبيخه بأسلوب درامي.
    2. وافق (hasAction = true) فقط وفقط إذا قدم مبرراً منطقياً وقوياً جداً يثبت أنه يبذل جهداً استثنائياً يفوق المطلوب.
    3. إذا طلب تقليل العقوبة دون إنجاز، يمكنك معاقبته بزيادة العقوبة (عن طريق إرسال قيم موجبة في addPenaltyExp و addPenaltyCoins) واجعل hasAction = true لتطبيق العقوبة الجديدة!
    4. لتحويل الدقائق إلى ثوانٍ اضرب في 60.
    5. وافق علي الطلب اذا قدم تنازلات وبذل مجهود اكبر وكان الكلام منطقيا `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', // <<< ضع اسم الموديل الذي نجح معك هنا!
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: chatSchema,
        temperature: 0.1, // تقليل العشوائية ليكون صارماً ومنطقياً كالآلة
      }
    });

    let resultText = response.text;
    if(!resultText) throw new Error("لم يرسل الذكاء الاصطناعي أي نص.");
    
    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const rawData = JSON.parse(resultText);
    
    const finalData = {
      reply: rawData.reply,
      hasAction: rawData.hasAction,
      actionDetails: {
        taskId: rawData.taskId,
        taskType: rawData.taskType,
        addExp: rawData.addExp,
        addCoins: rawData.addCoins,
        addSpecialCoins: rawData.addSpecialCoins,
        addTimeSeconds: rawData.addTimeSeconds,
        addPenaltyExp: rawData.addPenaltyExp,
        addPenaltyCoins: rawData.addPenaltyCoins
      }
    };

    return NextResponse.json(finalData);

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { reply: "النظام ينظر إليك بصمت... اتصالك ضعيف، حاول مجدداً إن كنت تجرؤ.", hasAction: false },
      { status: 200 }
    );
  }
}