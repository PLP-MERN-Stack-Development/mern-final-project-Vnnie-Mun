"""
Disease advice database
Contains treatment recommendations in English and Swahili
"""

DISEASE_ADVICE = {
    "Early Blight": {
        "en": "Remove affected leaves. Apply fungicide containing chlorothalonil or mancozeb. Ensure good air circulation. Water at soil level, not leaves. Rotate crops yearly.",
        "sw": "Ondoa majani yaliyoathirika. Tumia dawa ya kuvu yenye chlorothalonil au mancozeb. Hakikisha mzunguko mzuri wa hewa. Mwagilia kwenye udongo, si majani. Badilisha mazao kila mwaka."
    },
    "Late Blight": {
        "en": "Act immediately - this spreads fast! Remove and destroy infected plants. Apply copper-based fungicide. Avoid overhead watering. Plant resistant varieties.",
        "sw": "Fanya haraka - inasambaa haraka! Ondoa na uharibu mimea iliyoambukizwa. Tumia dawa ya kuvu yenye shaba. Epuka kumwagilia juu. Panda aina zinazostahimili."
    },
    "Leaf Mold": {
        "en": "Improve ventilation around plants. Reduce humidity. Apply sulfur-based fungicide. Remove affected leaves. Space plants properly.",
        "sw": "Boresha mzunguko wa hewa kuzunguka mimea. Punguza unyevu. Tumia dawa ya kuvu yenye sulfuri. Ondoa majani yaliyoathirika. Weka nafasi sahihi kati ya mimea."
    },
    "Common Rust": {
        "en": "Apply fungicide early. Remove infected leaves. Plant resistant hybrids. Ensure proper spacing. Monitor regularly during humid weather.",
        "sw": "Tumia dawa ya kuvu mapema. Ondoa majani yaliyoambukizwa. Panda mchanganyiko unaostahimili. Hakikisha nafasi sahihi. Fuatilia mara kwa mara wakati wa hali ya hewa yenye unyevu."
    },
    "Northern Leaf Blight": {
        "en": "Use resistant varieties. Rotate crops. Apply fungicide if severe. Remove crop debris after harvest. Avoid dense planting.",
        "sw": "Tumia aina zinazostahimili. Badilisha mazao. Tumia dawa ya kuvu ikiwa ni kali. Ondoa mabaki ya mazao baada ya kuvuna. Epuka kupanda kwa msongamano."
    },
    "Gray Leaf Spot": {
        "en": "Plant resistant hybrids. Rotate with non-host crops. Apply fungicide at first signs. Manage crop residue. Ensure good drainage.",
        "sw": "Panda mchanganyiko unaostahimili. Badilisha na mazao yasiyo na ugonjwa. Tumia dawa ya kuvu kwenye ishara za kwanza. Simamia mabaki ya mazao. Hakikisha mtiririko mzuri wa maji."
    },
    "Mosaic Disease": {
        "en": "Use disease-free planting material. Control whiteflies (disease vectors). Remove infected plants immediately. Plant resistant varieties. Practice crop rotation.",
        "sw": "Tumia vifaa vya kupanda visivyo na magonjwa. Dhibiti nzi weupe (wasambazaji wa ugonjwa). Ondoa mimea iliyoambukizwa mara moja. Panda aina zinazostahimili. Fanya mzunguko wa mazao."
    },
    "Brown Streak": {
        "en": "Use clean planting material. Remove infected plants. Control whiteflies. Harvest earlier if needed. Plant resistant varieties when available.",
        "sw": "Tumia vifaa safi vya kupanda. Ondoa mimea iliyoambukizwa. Dhibiti nzi weupe. Vuna mapema ikiwa ni lazima. Panda aina zinazostahimili zinapopatikana."
    },
    "Healthy": {
        "en": "Your crop looks healthy! Continue good practices: proper watering, fertilization, pest monitoring, and crop rotation. Prevention is key.",
        "sw": "Mazao yako yanaonekana yenye afya njema! Endelea na mazoezi mazuri: kumwagilia vizuri, mbolea, ufuatiliaji wa wadudu, na mzunguko wa mazao. Kuzuia ni muhimu."
    }
}


def get_disease_advice(disease_name: str) -> dict:
    """Get treatment advice for a disease"""
    advice = DISEASE_ADVICE.get(disease_name, {
        "en": "Consult with a local agricultural extension officer for specific treatment recommendations. General tips: maintain plant health, monitor regularly, and practice good crop hygiene.",
        "sw": "Wasiliana na afisa wa ugani wa kilimo wa eneo lako kwa mapendekezo maalum ya matibabu. Vidokezo vya jumla: dumisha afya ya mimea, fuatilia mara kwa mara, na fanya usafi mzuri wa mazao."
    })
    
    return advice