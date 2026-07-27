export const advancedPhonics = Array.from({ length: 40 }, (_, idx) => {
  const terms = [
    { w: "beautiful", p: ["beau", "ti", "ful"], s: ["/ˈbjuː/", "/tɪ/", "/fʊl/"] },
    { w: "elephant", p: ["el", "e", "phant"], s: ["/ˈɛ/", "/lɪ/", "/fənt/"] },
    { w: "yesterday", p: ["yes", "ter", "day"], s: ["/ˈjɛs/", "/tər/", "/deɪ/"] },
    { w: "remember", p: ["re", "mem", "ber"], s: ["/rɪ/", "/ˈmɛm/", "/bər/"] },
    { w: "communication", p: ["com", "mu", "ni", "ca", "tion"], s: ["/kə/", "/mjuː/", "/nɪ/", "/keɪ/", "/ʃən/"] },
    { w: "responsibility", p: ["re", "spon", "si", "bil", "i", "ty"], s: ["/rɪ/", "/ˌspɒn/", "/sə/", "/ˈbɪl/", "/ə/", "/ti/"] },

    { w: "adventure", p: ["ad", "ven", "ture"], s: ["/əd/", "/ˈvɛn/", "/tʃər/"] },
    { w: "important", p: ["im", "por", "tant"], s: ["/ɪm/", "/ˈpɔːr/", "/tənt/"] },
    { w: "knowledge", p: ["know", "ledge"], s: ["/ˈnɒ/", "/lɪdʒ/"] },
    { w: "different", p: ["dif", "fer", "ent"], s: ["/ˈdɪf/", "/ər/", "/ənt/"] },
    { w: "excellent", p: ["ex", "cel", "lent"], s: ["/ˈɛk/", "/sə/", "/lənt/"] },
    { w: "education", p: ["ed", "u", "ca", "tion"], s: ["/ˌɛd/", "/juː/", "/keɪ/", "/ʃən/"] },
    { w: "celebrate", p: ["cel", "e", "brate"], s: ["/ˈsɛl/", "/ə/", "/breɪt/"] },
    { w: "computer", p: ["com", "pu", "ter"], s: ["/kəm/", "/ˈpjuː/", "/tər/"] },
    { w: "discovery", p: ["dis", "cov", "er", "y"], s: ["/dɪs/", "/ˈkʌv/", "/ər/", "/i/"] },
    { w: "environment", p: ["en", "vi", "ron", "ment"], s: ["/ɪn/", "/ˈvaɪ/", "/rən/", "/mənt/"] },
    { w: "dictionary", p: ["dic", "tion", "ar", "y"], s: ["/ˈdɪk/", "/ʃə/", "/nər/", "/i/"] },
    { w: "understand", p: ["un", "der", "stand"], s: ["/ˌʌn/", "/dər/", "/ˈstænd/"] },
    { w: "independent", p: ["in", "de", "pen", "dent"], s: ["/ˌɪn/", "/dɪ/", "/ˈpɛn/", "/dənt/"] },
    { w: "opportunity", p: ["op", "por", "tu", "ni", "ty"], s: ["/ˌɒ/", "/pər/", "/ˈtuː/", "/nə/", "/ti/"] },
    { w: "imagination", p: ["im", "ag", "i", "na", "tion"], s: ["/ɪ/", "/ˌmædʒ/", "/ə/", "/ˈneɪ/", "/ʃən/"] }
  ];

  const choice = terms[idx % terms.length];

  return {
    word: choice.w,
    phonemes: choice.p,
    sounds: choice.s,
  };
});