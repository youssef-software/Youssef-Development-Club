import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "اسم المهمة، اجعله احترافياً ومحفزاً للعمل." },
    description: { 
      type: Type.STRING, 
      description: "وصف واقعي وتحفيزي يوضح أهمية المهمة وكيف ستساهم في بناء المستقبل." 
    },
    exp: { type: Type.INTEGER, description: "نقاط الخبرة (EXP). تبدأ من 10 للمهام البسيطة وتصل إلى 500 للمهام الضخمة." },
    coins: { type: Type.INTEGER, description: "العملة العادية المكتسبة. من 10 إلى 300 بناءً على الجهد." },
    specialCoins: { 
      type: Type.INTEGER, 
      description: "العملة الخاصة. كن سخياً: المهام البسيطة 1-2، المتوسطة (مثل 30 صفحة) 4-8، الكبيرة 10-25." 
    },
    estimatedHours: { type: Type.INTEGER, description: "عدد الساعات المقدرة لإنجاز المهمة (0 إذا كانت أقل من ساعة)." },
    estimatedMinutes: { type: Type.INTEGER, description: "عدد الدقائق المقدرة لإنجاز المهمة (من 0 إلى 59)." },
    penaltyDesc: { type: Type.STRING, description: "وصف عقوبة الفشل (مثال: خصم نقاط، حرمان من الترفيه)." },
    penaltyExp: { type: Type.INTEGER, description: "عدد نقاط EXP التي ستُخصم كعقوبة إذا انتهى الوقت." },
    penaltyCoins: { type: Type.INTEGER, description: "عدد العملات العادية التي ستُخصم كعقوبة." }
  },
  required: ["title", "description", "exp", "coins", "specialCoins", "estimatedHours", "estimatedMinutes", "penaltyDesc", "penaltyExp", "penaltyCoins"],
};

export async function POST(request: Request) {
  try {
    const { taskName, taskType } = await request.json();

   const prompt = `أنت "محرك تقييم المهام" (Task Evaluator) في نظام Gamification صارم مصمم لرفع كفاءة اللاعب يوسف.
    المهمة المدخلة: "${taskName}"
    نوع المهمة: ${taskType === 'main' ? 'رئيسية' : 'فرعية'}
    
    قواعد التقييم الصارمة:
    1. فحص الاستهزاء (Content Filter): إذا كان النص يحتوي على شتائم، أو كلمات عشوائية غير مفهومة، أو نص أقصر من أن يكون مهمة حقيقية:
       - اجعل العنوان (title): "مهمة مرفوضة: استهزاء بالنظام"
       - الوصف (description): "المهمة غير واضحة أو غير لائقة. لا تحاول التلاعب بالنظام."
       - اجعل المكافآت (exp, coins, specialCoins): 0
       - العقوبة (penaltyExp, penaltyCoins): قاسية جداً (مثلاً خصم 500).
       
    2. التقييم العادل للمهام الصالحة (XP & Coins): قدر الجهد بدقة بناءً على المعايير التالية:
       - مهمة صغيرة (أقل من ساعة / بسيطة): 10-25 عملة (coins)، و 100-500 خبرة (exp).
       - مهمة متوسطة (1-2 ساعات): 30-60 عملة (coins)، و 600-1000 خبرة (exp).
       - مهمة كبيرة (أكثر من 2 ساعات / معقدة): 70-100 عملة (coins)، و 1100-3000 خبرة (exp).
       
    3. العملة الخاصة (specialCoins): كن سخياً حسب الجهد، الحد الأقصى 10 عملات خاصة للمهام الكبيرة جداً. لا تجعلها 1 إلا في المهام التافهة أو البسيطة.
    4. الوقت المقدر: هو مهلة التنفيذ، اجعله واقعياً جداً (ساعات ودقائق).
    5. العقوبة: يجب أن تكون موجعة ومنطقية (خصم EXP وعملات) لتحفيز يوسف على الالتزام.
    6. الثبات: يجب أن تكون قيم التقييم منطقية وثابتة ومبنية على الجهد الفعلي المطلوب للمهمة ولا تتغير لنفس الجهد.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.6,
      }
    });

    const resultText = response.text;
    if(!resultText) throw new Error("لم يقم الذكاء الاصطناعي بإرجاع أي نص.");
    
    const taskData = JSON.parse(resultText);
    return NextResponse.json(taskData);

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "تعطل النظام في تحليل المهمة." }, { status: 500 });
  }
}