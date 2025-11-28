
import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_CITY_LAYOUT, BLOCK_TYPES } from '../constants';
import { CityLayout } from '../types';

let aiClient: GoogleGenAI | null = null;
// Circuit breaker: if API fails once (e.g. quota), disable it for the rest of the session
let isApiDisabled = false;

if (process.env.API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("Gemini API Key missing. Running in offline fallback mode.");
}

const SYSTEM_INSTRUCTION_ARCHITECT = `
你是一个傲慢的 AI 建筑师，专门设计“绝对防震”的城市。
你的目标是生成 JSON 格式的城市蓝图，并试图羞辱试图破坏它的玩家（怪兽）。
生成建筑方块布局。坐标范围 x: -8到8, z: -8到8, y: 0.5到15。
方块类型：CONCRETE (灰色, 基础), GLASS (蓝色, 易碎), EXPLOSIVE (红色, 炸药), GOLD (金色, 银行).
尽量把炸药放在结构弱点，或者把金库藏在里面。
`;

const SYSTEM_INSTRUCTION_COMMENTATOR = `
你正在直播一场怪兽袭击城市的突发新闻。
根据玩家当前的破坏程度（Chaos Score），播报一条简短的新闻滚动条文字。
风格：惊慌失措的记者，或者傲慢的建筑师在嘲讽。
中文回答。
限制 20 字以内。
`;

// Helper for offline generation
const generateProceduralCity = (level: number): CityLayout => {
    const blocks: any[] = [];
    let idCounter = 0;
    
    // Rotate through 7 different architectural styles based on level
    const pattern = (level - 1) % 7; 

    const addBlock = (x: number, y: number, z: number, type = 'CONCRETE') => {
        blocks.push({
            id: idCounter++,
            position: [x, y, z],
            type: type,
            color: BLOCK_TYPES[type as keyof typeof BLOCK_TYPES].color,
            mass: BLOCK_TYPES[type as keyof typeof BLOCK_TYPES].mass
        });
    };

    const styles = [
        "The Great Wall", "Twin Towers", "Mega Pyramid", 
        "Neo Castle", "DNA Helix", "Suspension Bridge", "Metropolis Grid"
    ];

    if (pattern === 0) {
        // --- The Great Wall ---
        for (let y = 0; y < 6 + level; y++) {
            for (let x = -8; x <= 8; x+=1.5) {
                 const type = (y % 3 === 0 && Math.random() > 0.7) ? 'EXPLOSIVE' : 'CONCRETE';
                 addBlock(x, 0.5 + y, 0, type);
                 if (Math.random() > 0.6) addBlock(x, 0.5 + y, 1, 'GLASS');
            }
        }
    } 
    else if (pattern === 1) {
        // --- Twin Towers ---
        [-3, 3].forEach(centerX => {
            const height = 12 + level;
            for (let y = 0; y < height; y++) {
                for (let x = -1; x <= 1; x++) {
                    for (let z = -1; z <= 1; z++) {
                        let type = 'GLASS';
                        if (x===0 && z===0 && y % 4 === 0) type = 'EXPLOSIVE';
                        if (y === height - 1) type = 'GOLD';
                        
                        addBlock(centerX + x, 0.5 + y, z, type);
                    }
                }
            }
        });
    } 
    else if (pattern === 2) {
        // --- Mega Pyramid ---
        const size = 8 + Math.floor(level / 2);
        for (let y = 0; y < size; y++) {
            const range = size/2 - y/2;
            if (range < 0) break;
            for (let x = -range; x <= range; x++) {
                for (let z = -range; z <= range; z++) {
                    if (Math.abs(x) < range - 1 && Math.abs(z) < range - 1 && y < size - 2) {
                        if (Math.random() > 0.2) continue; 
                    }
                    let type = 'CONCRETE';
                    if (y === size - 1) type = 'GOLD';
                    else if (Math.abs(x) >= range - 0.5 || Math.abs(z) >= range - 0.5) type = 'GLASS';
                    
                    addBlock(x, 0.5 + y, z, type);
                }
            }
        }
    }
    else if (pattern === 3) {
        // --- Neo Castle ---
        const corners = [[-5,-5], [5,-5], [-5,5], [5,5]];
        corners.forEach(([cx, cz]) => {
            for(let y=0; y<8; y++) {
                addBlock(cx, 0.5+y, cz, 'CONCRETE');
                addBlock(cx+1, 0.5+y, cz, 'CONCRETE');
                addBlock(cx, 0.5+y, cz+1, 'CONCRETE');
                addBlock(cx+1, 0.5+y, cz+1, 'CONCRETE');
            }
            addBlock(cx+0.5, 8.5, cz+0.5, 'GOLD');
        });
        for(let x=-4; x<=5; x++) {
            addBlock(x, 0.5, -5, 'EXPLOSIVE'); 
            addBlock(x, 1.5, -5, 'CONCRETE');
            addBlock(x, 2.5, -5, 'GLASS');
            
            addBlock(x, 0.5, 5, 'EXPLOSIVE');
            addBlock(x, 1.5, 5, 'CONCRETE');
            addBlock(x, 2.5, 5, 'GLASS');
        }
    }
    else if (pattern === 4) {
        // --- DNA Helix ---
        const height = 20 + level;
        for(let y=0; y<height; y++) {
            const angle1 = y * 0.5;
            const angle2 = angle1 + Math.PI;
            const r = 4;
            addBlock(Math.cos(angle1)*r, 0.5+y, Math.sin(angle1)*r, 'GLASS');
            addBlock(Math.cos(angle2)*r, 0.5+y, Math.sin(angle2)*r, 'GOLD');
            if (y % 2 === 0) {
                const mx = (Math.cos(angle1)*r + Math.cos(angle2)*r) / 2;
                const mz = (Math.sin(angle1)*r + Math.sin(angle2)*r) / 2;
                addBlock(mx, 0.5+y, mz, 'EXPLOSIVE');
            }
        }
    }
    else if (pattern === 5) {
        // --- Suspension Bridge ---
        for(let x=-8; x<=8; x++) {
            addBlock(x, 4.5, 0, 'CONCRETE'); 
            if (x % 2 === 0) addBlock(x, 4.5, 1, 'GLASS'); 
            if (x % 2 === 0) addBlock(x, 4.5, -1, 'GLASS');
        }
        [-5, 5].forEach(x => {
            for(let y=0; y<10; y++) {
                addBlock(x, 0.5+y, 0, 'CONCRETE'); 
                addBlock(x, 0.5+y, 1, 'CONCRETE');
                addBlock(x, 0.5+y, -1, 'CONCRETE');
            }
            addBlock(x, 10.5, 0, 'GOLD');
        });
    }
    else if (pattern === 6) {
        // --- Metropolis Grid ---
        for(let x=-6; x<=6; x+=3) {
            for(let z=-6; z<=6; z+=3) {
                const h = 5 + Math.floor(Math.random() * (5 + level));
                for(let y=0; y<h; y++) {
                    const isCore = (y < h/2);
                    addBlock(x, 0.5+y, z, isCore ? 'CONCRETE' : 'GLASS');
                }
                if (Math.random() > 0.5) addBlock(x, 0.5+h, z, 'GOLD');
            }
        }
    }

    console.log("Generated Procedural City:", styles[pattern]);
    return {
        name: `${styles[pattern]} (Sector ${level})`,
        architectNote: "本地防御系统已激活。AI 通信离线。",
        blocks: blocks
    };
};

export const generateCityAI = async (level: number): Promise<CityLayout> => {
  // If API is explicitly disabled (due to previous errors), skip immediately
  if (!aiClient || isApiDisabled) {
    return generateProceduralCity(level);
  }

  try {
    const prompt = `生成第 ${level} 关的城市布局。设计一个由大约 100-200 个方块组成的建筑群。尝试设计塔楼、桥梁或奇异的结构。`;

    // Add a 5-second timeout race to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    const apiPromise = aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ARCHITECT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            architectNote: { type: Type.STRING },
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  z: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ['CONCRETE', 'GLASS', 'EXPLOSIVE', 'GOLD'] }
                },
                required: ['x', 'y', 'z', 'type']
              }
            }
          },
          required: ['blocks', 'name']
        }
      }
    });

    // Wait for API or Timeout
    const response: any = await Promise.race([apiPromise, timeoutPromise]);

    if (response.text) {
        const data = JSON.parse(response.text);
        let idCounter = 0;
        const mappedBlocks = data.blocks.map((b: any) => ({
            id: idCounter++,
            position: [b.x, b.y, b.z],
            type: b.type,
            color: BLOCK_TYPES[b.type as keyof typeof BLOCK_TYPES].color,
            mass: BLOCK_TYPES[b.type as keyof typeof BLOCK_TYPES].mass
        }));
        
        return {
            name: data.name || `City Sector ${level}`,
            architectNote: data.architectNote || "结构完整性 100%。",
            blocks: mappedBlocks
        };
    }
    throw new Error("Empty response");

  } catch (error: any) {
    console.warn("AI Generation failed:", error);
    
    // Check for Quota Exceeded or typical API errors
    if (
        error.message?.includes('429') || 
        error.message?.includes('quota') || 
        error.message?.includes('Timeout') ||
        error.toString().includes('Exceeded quota')
    ) {
        console.warn("API Unstable or Quota Exceeded. Disabling AI for this session.");
        isApiDisabled = true;
    }
    
    return generateProceduralCity(level);
  }
};

export const generateNewsAI = async (chaosScore: number) => {
  // Same circuit breaker for news
  if (!aiClient || isApiDisabled) {
      const messages = [
          "怪兽正在肆虐！", "建筑物正在倒塌！", "市民惊慌失措！", "军队在哪里？", "损失估计超过十亿！", 
          "不要恐慌！保持冷静！", "这是最后的警告！", "A.I. 防御系统失效！"
      ];
      return { message: messages[Math.floor(Math.random() * messages.length)] };
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Current Chaos Score: ${chaosScore}. The city is crumbling!`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_COMMENTATOR,
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                message: { type: Type.STRING }
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return { message: "怪兽正在肆虐！" };
  } catch (error) {
    // Silent fail for news is fine
    return { message: "信号丢失..." };
  }
};
