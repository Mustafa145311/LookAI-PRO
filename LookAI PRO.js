/**
 * LookAI PRO - TEK PARÇA (ALL-IN-ONE) JAVASCRIPT MOTORU & KULLANICI ARAYÜZÜ
 * Kamera yakalama, Gemini 2.5 Flash Vision analizi, soru çözücü, STEM atölyesi,
 * Türkçe sesli okuma (TTS), AES-256-GCM şifreleme ve WhatsApp paylaşımının tamamı.
 */

// ==========================================
// 1. SESLİ OKUMA (SPEECH SYNTHESIS)
// ==========================================
export const Speech = {
  speak(text, onEnd) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#`~]/g, " ").slice(0, 350));
    u.lang = "tr-TR";
    u.rate = 1.0;
    u.onend = () => onEnd && onEnd();
    u.onerror = () => onEnd && onEnd();
    window.speechSynthesis.speak(u);
  },
  stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
};

// ==========================================
// 2. AES-256-GCM UÇTAN UCA ŞİFRELEME (VAULT)
// ==========================================
export const CryptoVault = {
  async getKey() {
    const s = localStorage.getItem("lookai_vault_key");
    if (s) return await crypto.subtle.importKey("raw", Uint8Array.from(atob(s), c => c.charCodeAt(0)), "AES-GCM", true, ["encrypt", "decrypt"]);
    const k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const exp = await crypto.subtle.exportKey("raw", k);
    localStorage.setItem("lookai_vault_key", btoa(String.fromCharCode(...new Uint8Array(exp))));
    return k;
  },
  async encrypt(data) {
    try {
      const k = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(JSON.stringify(data)));
      return { iv: btoa(String.fromCharCode(...iv)), ciphertext: btoa(String.fromCharCode(...new Uint8Array(enc))), algorithm: "AES-256-GCM" };
    } catch {
      return { ciphertext: btoa(encodeURIComponent(JSON.stringify(data))), algorithm: "PLAIN" };
    }
  },
  async decrypt(payload) {
    try {
      if (payload.algorithm === "PLAIN") return JSON.parse(decodeURIComponent(atob(payload.ciphertext)));
      const k = await this.getKey();
      const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0)) }, k, Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0)));
      return JSON.parse(new TextDecoder().decode(dec));
    } catch {
      return null;
    }
  }
};

// ==========================================
// 3. GEMINI VISION & AI İSTEMCİSİ
// ==========================================
export const LookAI = {
  async analyze(imageBase64, mode = "object_detection", customPrompt = "") {
    const res = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mode, customPrompt })
    });
    const json = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || "Analiz yapılamadı.");
    return json.data;
  },
  async askFollowUp(previousAnalysis, userQuestion) {
    const res = await fetch("/api/ask-followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previousAnalysis, userQuestion })
    });
    const json = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || "Cevap alınamadı.");
    return json.data;
  },
  async generateSTEMToy(materials = [], ageGroup = "7-12 Yaş", theme = "Robot") {
    const res = await fetch("/api/generate-stem-toy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materials, ageGroup, theme })
    });
    const json = await res.json();
    if (!json.success || !json.project) throw new Error(json.error || "STEM üretilemedi.");
    return json.project;
  },
  shareWhatsApp(a) {
    const txt = encodeURIComponent(`🔍 *LookAI Raporu*\n📌 *${a.title}* (${a.category})\n✨ *Özet:* ${a.summary}\n${a.finalAnswer ? `🎯 *Doğru Cevap:* ${a.finalAnswer}\n` : ""}🔬 *Bilimsel İlke:* ${a.scientificConcept?.principle || "N/A"}\n🤖 *STEM:* ${a.diyStemIdea?.toyName || "N/A"}`);
    window.open(`https://api.whatsapp.com/send?text=${txt}`, "_blank");
  }
};

// ==========================================
// 4. CANLI KAMERA YÖNETİCİSİ
// ==========================================
export class CameraEngine {
  constructor(videoEl) {
    this.video = videoEl;
    this.stream = null;
  }
  async start(facingMode = "environment") {
    this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 } }, audio: false });
    if (this.video) {
      this.video.srcObject = this.stream;
      await this.video.play();
    }
  }
  stop() {
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.video) this.video.srcObject = null;
  }
  capture(quality = 0.92) {
    if (!this.video) return null;
    const c = document.createElement("canvas");
    c.width = this.video.videoWidth || 640;
    c.height = this.video.videoHeight || 480;
    c.getContext("2d").drawImage(this.video, 0, 0);
    return c.toDataURL("image/jpeg", quality);
  }
}

// ==========================================
// 5. TEK SATIRDA ÇALIŞTIRMA & TEST YARDIMCISI
// ==========================================
export async function runFullAnalysis(base64Image, mode = "object_detection") {
  console.log("⚡ [LookAI] Analiz başlatılıyor...");
  const result = await LookAI.analyze(base64Image, mode);
  console.log("✅ [LookAI] Başlık:", result.title);
  console.log("🎯 [LookAI] Nihai Cevap:", result.finalAnswer || "Mevcut Değil");
  console.log("🔬 [LookAI] Bilimsel İlke:", result.scientificConcept?.principle);
  
  // Şifreli Kasaya Kaydet
  const encrypted = await CryptoVault.encrypt(result);
  localStorage.setItem("lookai_son_kayit", JSON.stringify(encrypted));
  
  // Sesli Oku
  Speech.speak(`${result.title}. ${result.summary}`);
  return result;
}