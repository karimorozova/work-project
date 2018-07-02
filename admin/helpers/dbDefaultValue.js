
const languagesDefault = [
    {"lang":"Afrikaans", "icon": "/static/flags31x21pix/Afrikaans[AF].png", "symbol":"AF", "iso1":"af", "iso2":"afr", "direction":"in"},
    {"lang":"Arabic", "icon":"/static/flags31x21pix/Arabic[AR].png", "symbol":"AR", "direction":"both","dialects":[{"lang":"Arabic(Saudi Arabia)", "icon":"/static/flags31x21pix/Arabic(SaudiArabia)[AR-SA].png", "symbol":"AR-SA", "iso1":"ar-SA", "iso2":"ara-SA", "direction":"in", "check": false},{"lang":"Arabic (Egypt)", "icon":"/static/flags31x21pix/Arabic(Egypt)[AR-EG].png", "symbol":"AR-EG", "iso1":"ar-EG", "iso2":"ara-EG", "direction":"in", "check": false},{"lang":"Arabic (Morocco)", "icon":"/static/flags31x21pix/Arabic(Morocco)[AR-MA].png", "symbol":"AR-MA", "iso1":"ar-MA", "iso2":"ara-MA", "direction":"in", "check": false}]},
    {"lang":"Azerbaijani (Latin)", "icon":"/static/flags31x21pix/Azerbaijani(Latin)[AZ-LN].png", "symbol":"AZ-LN", "iso1":"az-AZ-Latin", "iso2":"aze", "direction":"in"},
    {"lang":"Bulgarian", "icon":"/static/flags31x21pix/Bulgarian[BG].png", "symbol":"BG", "iso1":"bg-BG", "iso2":"bul", "direction":"both"},
    {"lang":"Bengali (Indida)", "icon":"/static/flags31x21pix/Bengali(India)[BN-IN].png", "symbol":"BN-IN", "iso1":"bn_IN", "iso2":"ben_IN", "direction":"in"},
    {"lang":"Bosnian", "icon":"/static/flags31x21pix/Bosnian[BS].png", "symbol":"BS", "iso1":"bs", "iso2":"bos", "direction":"in"},
    {"lang":"Czech", "icon":"/static/flags31x21pix/Czech[CS].png", "symbol":"CS", "iso1":"cz-CZ", "iso2":"cze", "direction":"in"},
    {"lang":"Danish", "icon":"/static/flags31x21pix/Danish[DA].png", "symbol":"DA", "iso1":"da-DK", "iso2":"dan", "direction":"both"},
    {"lang":"Dutch", "icon":"/static/flags31x21pix/Dutch[NL].png", "symbol":"NL","direction":"both","dialects":[{"lang":"Dutch (Netherlands)", "icon":"/static/flags31x21pix/Dutch(Netherlands)[NL-NL].png", "symbol":"NL-NL", "iso1":"nl-NL", "iso2":"dut-NL", "direction":"both", "check": false},{"lang":"Flemish", "icon":"/static/flags31x21pix/Flemish[NL-BE].png", "symbol":"NL-BE", "iso1":"nl-BE", "iso2":"dut-BE", "direction":"both", "check": false}]},    
    {"lang":"German", "icon":"/static/flags31x21pix/German[DE].png", "symbol":"DE", "iso1":"de", "iso2":"ger", "diraction":"both","dialects":[{"lang":"German (Germany)", "icon":"/static/flags31x21pix/German(Germany)[DE-DE].png", "symbol":"DE-DE", "iso1":"de-DE", "iso2":"ger-DE", "direction":"both", "check": false},{"lang":"German (Austria)", "icon":"/static/flags31x21pix/German(Austria)[DE-AT].png", "symbol":"DE-AT", "iso1":"de-AT", "ger-AT":"afr", "direction":"both", "check": false},{"lang":"German (Switzerland)", "icon":"/static/flags31x21pix/German(Switzerland)[DE-CH].png", "symbol":"DE-CH", "iso1":"de-CH", "iso2":"ger-CH", "direction":"both", "check": false}]},
    {"lang":"Greek", "icon":"/static/flags31x21pix/Greek[EL].png", "symbol":"EL", "iso1":"el-GR", "iso2":"gre", "direction":"both"},
    {"lang":"English", "symbol":"EN", "direction":"both","dialects":[{"lang":"English (United Kingdom)", "icon":"/static/flags31x21pix/English_English(UnitedKingdom)[EN-GB].png", "symbol":"EN-GB", "iso1":"en-GB", "iso2":"eng-GB", "direction":"both", "check": false},{"lang":"English (United States)", "icon":"/static/flags31x21pix/English(UnitedStates)[EN-US].png", "symbol":"EN-US", "iso1":"en-US", "iso2":"eng-US", "direction":"both", "check": false}]},
    {"lang":"Spanish (Spain)", "icon":"/static/flags31x21pix/Spanish(Spain)[ES-ES].png", "symbol":"ES-ES", "iso1":"es-ES", "iso2":"spa-ES", "direction":"both"},
    {"lang":"Spanish (Latin America)", "icon":"/static/flags31x21pix/Spanish(LatinAmerica)[ES-419].png", "iso1":"es-AR", "iso2":"spa-419", "direction":"in","symbol":"ES-419","dialects":[{"lang":"Spanish (Argentina)", "icon":"/static/flags31x21pix/Spanish(Argentina)[ES-AR].png", "symbol":"ES-AR","direction":"in", "check": false},{"lang":"Spanish (Mexico)","symbol":"ES-MX","direction":"both", "check": false}]},
    {"lang":"Estonian", "icon":"/static/flags31x21pix/Estonian[ET].png", "symbol":"ET", "iso1":"et-EE", "iso2":"est", "direction":"both"},
    {"lang":"Farsi (Persian)", "icon":"/static/flags31x21pix/Farsi(Persian)[FA].png", "symbol":"FA", "iso1":"fa-IR", "iso2":"ger", "direction":"both"},
    {"lang":"Finnish", "icon":"/static/flags31x21pix/Finnish[FI].png", "symbol":"FI", "iso1":"fi-FI", "iso2":"fin", "direction":"both"},
    {"lang":"French", "symbol":"FR","direction":"both","dialects":[{"lang":"French (France)", "icon":"/static/flags31x21pix/French(France)[FR-FR].png", "symbol":"FR-FR", "iso1":"fr-FR", "iso2":"fre-FR", "direction":"both", "check": false},{"lang":"French (Belgium)", "icon":"/static/flags31x21pix/French(Belgium)[FR-BE].png", "symbol":"FR-BE", "iso1":"fr-BE", "iso2":"fre-BE", "direction":"both", "check": false},{"lang":"French (Canada)", "icon":"/static/flags31x21pix/French(Canada)[FR-CA].png", "symbol":"FR-CA", "iso1":"fr-CA", "iso2":"fre-CA", "direction":"in", "check": false},{"lang":"French (Switzerland)", "icon":"/static/flags31x21pix/French(Switzerland)[FR-CH].png", "symbol":"FR-CH", "iso1":"fr-CH", "iso2":"fre-CH", "direction":"in", "check": false}]},
    {"lang":"Hebrew", "icon":"/static/flags31x21pix/Hebrew[HE].png", "symbol":"HE", "iso1":"he-IL", "iso2":"heb", "direction":"both"},
    {"lang":"Hindi", "icon":"/static/flags31x21pix/Hindi[HI].png", "symbol":"HI", "iso1":"hi-IN", "iso2":"hin", "direction":"in"},
    {"lang":"Croatian", "icon":"/static/flags31x21pix/Croatian[HR].png", "symbol":"HR", "iso1":"hr-HR", "iso2":"hrv", "direction":"in"},
    {"lang":"Hungarian", "icon":"/static/flags31x21pix/Hungarian[HU].png", "symbol":"HU", "iso1":"hu-HU", "iso2":"hun", "direction":"in"},
    {"lang":"Armenian", "icon":"/static/flags31x21pix/Armenian[HY].png", "symbol":"HY", "iso1":"hy-AM", "iso2":"hye", "direction":"both"},
    {"lang":"Indonesian", "icon":"/static/flags31x21pix/Indonesian[ID].png", "symbol":"ID", "iso1":"id-ID", "iso2":"ind", "direction":"both"},
    {"lang":"Icelandic", "icon":"/static/flags31x21pix/Icelandic[IS].png", "symbol":"IS", "iso1":"is-IS", "iso2":"ice", "direction":"both"},
    {"lang":"Italian", "icon":"/static/flags31x21pix/Italian[IT].png", "symbol":"IT", "iso1":"it", "iso2":"ita", "direction":"in","dialects":[{"lang":"Italian (Italy)", "icon":"/static/flags31x21pix/Italian(Italy)[IT-IT].png", "symbol":"IT-IT", "iso1":"it-IT", "iso2":"ita-IT", "direction":"in", "check": false},{"lang":"Italian (Switzerland)", "icon":"/static/flags31x21pix/Italian(Switzerland)[IT-CH].png", "symbol":"IT-CH", "iso1":"it-CH", "iso2":"ita-CH", "direction":"in", "check": false}]},
    {"lang":"Japanese", "icon":"/static/flags31x21pix/Japanese[JA].png", "symbol":"JA", "iso1":"ja-JP", "iso2":"jpn", "direction":"in"},
    {"lang":"Georgian", "icon":"/static/flags31x21pix/Georgian[KA].png", "symbol":"KA", "iso1":"ka-GE", "iso2":"kat", "direction":"in"},
    {"lang":"Kazakh", "icon":"/static/flags31x21pix/Kazakh[KK].png", "symbol":"KK", "iso1":"kk-KZ", "iso2":"kaz", "direction":"in"},
    {"lang":"Korean", "icon":"/static/flags31x21pix/Korean[KO].png", "symbol":"KO", "iso1":"ko-KR", "iso2":"kor", "direction":"in"},
    {"lang":"Lithuanian", "icon":"/static/flags31x21pix/Lithuanian[LT].png", "symbol":"LT", "iso1":"lt-LT", "iso2":"lit", "direction":"in"},
    {"lang":"Latvian", "icon":"/static/flags31x21pix/Latvian[LV].png", "symbol":"LV", "iso1":"lv-LV", "iso2":"lav", "direction":"in"},
    {"lang":"Moldavian", "icon":"/static/flags31x21pix/Moldavian[MO].png", "symbol":"MO", "iso1":"mo-MD", "iso2":"mol", "direction":"both"},
    {"lang":"Marathi", "icon":"/static/flags31x21pix/Marathi[MR].png", "symbol":"MR", "iso1":"mr-IN", "iso2":"mar", "direction":"both"},
    {"lang":"Malay", "icon":"/static/flags31x21pix/Malay[MS].png", "symbol":"MS", "iso1":"ms-MY", "iso2":"msa", "direction":"both"},
    {"lang":"Norwegian (Bokmaal)", "icon":"/static/flags31x21pix/Norwegian(Bokmaal)[NB].png", "symbol":"NB", "iso1":"nb-NO", "iso2":"nnb", "direction":"in"},
    {"lang":"Punjabi", "icon":"/static/flags31x21pix/Punjabi[PA].png", "symbol":"PA", "iso1":"pa-PA", "iso2":"pan", "direction":"both"},
    {"lang":"Polish", "icon":"/static/flags31x21pix/Polish[PL].png", "symbol":"PL", "iso1":"de", "iso2":"ger", "direction":"in"},
    {"lang":"Portuguese (Brazil)", "icon":"/static/flags31x21pix/Portuguese(Brazil)[PT-BR].png", "symbol":"PT-BR", "iso1":"pt-BR", "iso2":"por-BR", "direction":"both"},
    {"lang":"Portuguese (Portugal)", "icon":"/static/flags31x21pix/Portuguese(Portugal)[PT-PT].png", "symbol":"PT-PT", "iso1":"pt-PT", "iso2":"por-PT", "direction":"in"},
    {"lang":"Romanian", "icon":"/static/flags31x21pix/Romanian[RO].png", "symbol":"RO", "iso1":"ro-RO", "iso2":"rum", "direction":"in"},
    {"lang":"Russian", "icon":"/static/flags31x21pix/Russian[RU].png", "symbol":"RU", "iso1":"ru-RU", "iso2":"rus", "direction":"in"},
    {"lang":"Slovak", "icon":"/static/flags31x21pix/Slovak[SK].png", "symbol":"SK", "iso1":"sk-SK", "iso2":"slo","direction":"both"},
    {"lang":"Slovenian", "icon":"/static/flags31x21pix/Slovenian[SL].png", "symbol":"SL", "iso1":"sl-SL", "iso2":"slv", "direction":"in"},
    {"lang":"Serbian (Latin)", "icon":"/static/flags31x21pix/Serbian(Latin)[SR-LA].png", "symbol":"SR-LA", "iso1":"sr-LA", "iso2":"scr", "direction":"in"},
    {"lang":"Swedish (Sweden)", "icon":"/static/flags31x21pix/Swedish(Sweden)[SV-SE].png", "symbol":"SV-SE", "iso1":"sv-SE", "iso2":"swe-SE", "direction":"in"},
    {"lang":"Telugu", "symbol":"TE","direction":"in"},
    {"lang":"Thai", "icon":"/static/flags31x21pix/Thai[TH].png", "symbol":"TH", "iso1":"th-TH", "iso2":"tai", "direction":"both"},
    {"lang":"Turkmen", "icon":"/static/flags31x21pix/Turkmen[TK].png", "symbol":"TK", "iso1":"tk-TM", "iso2":"tuk", "direction":"in"},
    {"lang":"Tagalog", "icon":"/static/flags31x21pix/Tagalog[TL].png", "symbol":"TL", "iso1":"tl-PH", "iso2":"tgl", "direction":"in"},
    {"lang":"Turkish", "icon":"/static/flags31x21pix/Turkish[TR].png", "symbol":"TR", "iso1":"tr-TR", "iso2":"tur", "direction":"in"},
    {"lang":"Ukrainian", "icon":"/static/flags31x21pix/Ukrainian[UK].png", "symbol":"UK", "iso1":"uk-UA", "iso2":"ukr", "direction":"in"},
    {"lang":"Urdu", "icon":"/static/flags31x21pix/Urdu[UR].png", "symbol":"UR", "iso1":"ur-IN", "iso2":"urd", "direction":"in"},
    {"lang":"Uzbek", "icon":"/static/flags31x21pix/Uzbek[UZ].png", "symbol":"UZ", "iso1":"uz-UZ-Latn", "iso2":"uzb", "direction":"in"},
    {"lang":"Vietnamese", "icon":"/static/flags31x21pix/Vietnamese[VI].png", "symbol":"VI", "iso1":"vi-VN", "iso2":"vie", "direction":"in"},
    {"lang":"Chinese Simplified", "icon":"/static/flags31x21pix/SimplifiedChinese_Chinese(China)[ZH-CN]_TraditionalChinese.png", "symbol":"ZH-CN", "direction":"in","dialects":[{"lang":"Chinese (China)", "symbol":"ZH-CN", "iso1":"zn-CN", "iso2":"zho-CN", "direction":"in", "check": false},{"lang":"Chinese (Singapore)", "icon":"/static/flags31x21pix/Chinese(Singapore)ZH-SG].png", "symbol":"ZH-SG", "iso1":"zn-SG", "iso2":"zho-SG", "direction":"in", "check": false}]},
    {"lang":"Chinese Traditional","symbol":"ZH-CN","direction":"in","dialects":[{"lang":"Chinese (Hong Kong)", "icon":"/static/flags31x21pix/Chinese(HongKong)[ZH-HK].png", "symbol":"ZH-HK", "iso1":"zn-HK", "iso2":"zho-HK", "direction":"in", "check": false},{"lang":"Chinese (Macao)", "icon":"/static/flags31x21pix/Chinese(Macao)[ZH-MO].png", "symbol":"ZH-MO", "iso1":"zn-MO", "iso2":"zho-MO", "direction":"in"},{"lang":"Chinese (Taiwan)","symbol":"ZH-TW", "iso1":"zn-TW", "iso2":"zho-TW", "direction":"in", "check": false}]},
];
const requestsDefault = [
    {
        date: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        contactName: "Jhon",
        contactEmail: "jhon@email.com", 
        service: {title: "Translation"}, 
        industry: "Games", 
        status: "Open", 
        accountManager: "manager1", 
        web: "ap.com", 
        skype: "asd", 
        phone: "123456789", 
        companyName: "Apple"
    },
    { 
        date: new Date(new Date().setMonth(new Date().getMonth() - 2)), 
        contactName: "Elen", 
        contactEmail: "elen@email.com", 
        service: {title: "Design"}, 
        industry: "Real Estate", 
        status: "Canceled", 
        accountManager: "manager2", 
        web: "sam.com", 
        skype: "qwe", 
        phone: "123456789", 
        companyName: "Samsung" 
    },
    { 
        date: new Date(new Date().setMonth(new Date().getMonth() - 3)), 
        contactName: "Andrew", 
        contactEmail: "andrew@email.com", 
        service: {title: "Translation"}, 
        industry: "Casino", 
        status: "Assigned", 
        accountManager: "manager2", 
        web: "ea.com", 
        skype: "gfd", 
        phone: "123456789", 
        companyName: "EA-Sports" 
    },
    { 
        date: new Date(new Date().setMonth(new Date().getMonth() - 4)), 
        contactName: "George", 
        contactEmail: "george@email.com", 
        service: {title: "Copywriting"}, 
        industry: "Other", 
        status: "Close", 
        accountManager: "manager1", 
        web: "vul.com", 
        skype: "hgfd", 
        phone: "123456789", 
        companyName: "Vulcan" 
    },
    { 
        date: new Date(new Date().setMonth(new Date().getMonth() - 5)), 
        contactName: "Mike", 
        contactEmail: "mike@email.com", 
        service: {title: "Graphic design"}, 
        industry: "Cryptocurrency", 
        status: "Assigned", 
        accountManager: "manager1", 
        web: "cont.com", 
        skype: "rty", 
        phone: "123456879", 
        companyName: "Continental" },
    { 
        date: new Date(new Date().setMonth(new Date().getMonth())), 
        contactName: "Nathan", 
        contactEmail: "nathan@email.com", 
        service: {title: "Copywriting"}, 
        industry: "Games", 
        status: "New", 
        accountManager: "manager3", 
        web: "ms.com", 
        skype: "uyuyu", 
        phone: "123456789", 
        companyName: "Microsoft" 
    }            
];
const usersDefault = [
    { email: 'test@test.com', password: '12345', username: 'Petia' }
];

const servicesDefault = [
    {sortIndex: 1, xtrf: 11, projectType: "regular", title: "Translation", source: true, languages: {source: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH"], target: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH", "AF", "AR-EG", "AR-MA", "AR-SA", "AZ-LN", "BN-IN", "BS", "CS", "ES-419", "ES-AR", "FR-CA", "FR-CH", "HI", "HR", "HU", "IT", "IT-IT", "IT-CH", "JA", "KA", "KK", "KO", "LT", "LV", "NB", "NL", "PL", "PT-PT", "RO", "RU", "SL", "SR-LA", "SV-SE", "TE", "TK", "TL", "TR", "UK", "UR", "UZ", "VI", "ZH-CN", "ZH-SG", "ZH-HK", "ZH-MO", "ZH-TW"]}},
    {sortIndex: 2, xtrf: 11, projectType: "regular", title: "Localization", source: true, languages: {source: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH"], target: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH", "AF", "AR-EG", "AR-MA", "AR-SA", "AZ-LN", "BN-IN", "BS", "CS", "ES-419", "ES-AR", "FR-CA", "FR-CH", "HI", "HR", "HU", "IT", "IT-IT", "IT-CH", "JA", "KA", "KK", "KO", "LT", "LV", "NB", "NL", "PL", "PT-PT", "RO", "RU", "SL", "SR-LA", "SV-SE", "TE", "TK", "TL", "TR", "UK", "UR", "UZ", "VI", "ZH-CN", "ZH-SG", "ZH-HK", "ZH-MO", "ZH-TW"]}},
    {sortIndex: 3, xtrf: 35, projectType: "smart", title: "Proofing", source: true, languages: {source: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH"], target: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH", "AF", "AR-EG", "AR-MA", "AR-SA", "AZ-LN", "BN-IN", "BS", "CS", "ES-419", "ES-AR", "FR-CA", "FR-CH", "HI", "HR", "HU", "IT", "IT-IT", "IT-CH", "JA", "KA", "KK", "KO", "LT", "LV", "NB", "NL", "PL", "PT-PT", "RO", "RU", "SL", "SR-LA", "SV-SE", "TE", "TK", "TL", "TR", "UK", "UR", "UZ", "VI", "ZH-CN", "ZH-SG", "ZH-HK", "ZH-MO", "ZH-TW"]}},
    {sortIndex: 6, xtrf: 11, projectType: "regular", title: "SEO Translation", source: true, languages: {source: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH"], target: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH", "AF", "AR-EG", "AR-MA", "AR-SA", "AZ-LN", "BN-IN", "BS", "CS", "ES-419", "ES-AR", "FR-CA", "FR-CH", "HI", "HR", "HU", "IT", "IT-IT", "IT-CH", "JA", "KA", "KK", "KO", "LT", "LV", "NB", "NL", "PL", "PT-PT", "RO", "RU", "SL", "SR-LA", "SV-SE", "TE", "TK", "TL", "TR", "UK", "UR", "UZ", "VI", "ZH-CN", "ZH-SG", "ZH-HK", "ZH-MO", "ZH-TW"]}},
    {sortIndex: 8, xtrf: 12, projectType: "smart", title: "QA and Testing", source: true, languages: {source: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH"], target: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH", "AF", "AR-EG", "AR-MA", "AR-SA", "AZ-LN", "BN-IN", "BS", "CS", "ES-419", "ES-AR", "FR-CA", "FR-CH", "HI", "HR", "HU", "IT", "IT-IT", "IT-CH", "JA", "KA", "KK", "KO", "LT", "LV", "NB", "NL", "PL", "PT-PT", "RO", "RU", "SL", "SR-LA", "SV-SE", "TE", "TK", "TL", "TR", "UK", "UR", "UZ", "VI", "ZH-CN", "ZH-SG", "ZH-HK", "ZH-MO", "ZH-TW"]}},
    {sortIndex: 9, xtrf: 25, projectType: "smart", title: "Graphic Localization", source: true, languages: {source: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH"], target: ["AR", "BG", "DA", "DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "ET", "FA", "FI", "FR", "FR-FR", "FR-BE", "HE", "HY", "ID", "IS", "MO", "MR", "MS", "NL-NL", "NL-BE", "PA", "PT-BR", "SK", "TH", "AF", "AR-EG", "AR-MA", "AR-SA", "AZ-LN", "BN-IN", "BS", "CS", "ES-419", "ES-AR", "FR-CA", "FR-CH", "HI", "HR", "HU", "IT", "IT-IT", "IT-CH", "JA", "KA", "KK", "KO", "LT", "LV", "NB", "NL", "PL", "PT-PT", "RO", "RU", "SL", "SR-LA", "SV-SE", "TE", "TK", "TL", "TR", "UK", "UR", "UZ", "VI", "ZH-CN", "ZH-SG", "ZH-HK", "ZH-MO", "ZH-TW"]}},
    {sortIndex: 4, xtrf: 13, projectType: "smart", title: "Copywriting", source: false, languages: {source: [], target: ["AR", "AR-EG", "AR-SA", "AR-MA", "DE", "EN", "EN-GB", "EN-US", "ES-ES", "ES-419", "ES-AR", "ES-MX", "FR", "FR-FR", "HE", "IT", "IT-IT", "JA", "NB", "NL", "NL-NL", "PL", "RU", "SV-SE", "TR"]}},
    {sortIndex: 5, xtrf: 13, projectType: "smart", title: "Blogging", source: false, languages: {source: [], target: ["AR", "AR-EG", "AR-SA", "AR-MA", "DE", "EN", "EN-GB", "EN-US", "ES-ES", "ES-419", "ES-AR", "ES-MX", "FR", "FR-FR", "HE", "IT", "IT-IT", "JA", "NB", "NL", "NL-NL", "PL", "RU", "SV-SE", "TR"]}},
    {sortIndex: 7, xtrf: 13, projectType: "smart", title: "SEO Writing", source: false, languages: {source: [], target: ["AR", "AR-EG", "AR-SA", "AR-MA", "DE", "EN", "EN-GB", "EN-US", "ES-ES", "ES-419", "ES-AR", "ES-MX", "FR", "FR-FR", "HE", "IT", "IT-IT", "JA", "NB", "NL", "NL-NL", "PL", "RU", "SV-SE", "TR"]}},
    {sortIndex: 10, xtrf: 11, projectType: "regular", title: "Official Translation", source: true, languages: {source: ["DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "FR", "FR-FR", "FR-BE", "HE", "NL-NL", "NL-BE", "PT-BR", "TH"], target: ["DE", "DE-DE", "DE-AT", "DE-CH", "EL", "EN", "EN-GB", "EN-US", "ES-ES", "ES-MX", "FR", "FR-FR", "FR-BE", "HE", "NL-NL", "NL-BE", "PT-BR", "ES-419", "ES-AR", "FR-CA", "FR-CH", "IT", "IT-IT", "IT-CH", "NB", "NL", "PL", "RO", "RU"]}},
];

const industriesDefault = [
    {name: 'CASINO, POKER & IGAMING', icon: '/static/industries/casino-poker-igaming.png', download: '/static/Download-icon.png', generic: '/static/example.xlsx', active: true},
    {name: 'CFDS & ONLINE TRADING', icon: '/static/industries/cfds-online-tranding.png', download: '/static/Download-icon.png', generic: '/static/example.xlsx',active: true},
    {name: 'HOTEL & REAL ESTATES', icon: '/static/industries/hotel-real-estates.png', download: '/static/Download-icon.png', generic: '/static/example.xlsx', active: true},
    {name: 'ICOS & CRYPTOCURRENCY', icon: '/static/industries/icos-cryptocurrency.png', download: '/static/Download-icon.png', generic: '/static/example.xlsx', active: true},
    {name: 'LEGAL', icon: '/static/industries/legal-icon.png', download: '/static/Download-icon.png', generic: '/static/example.xlsx', active: true},
    {name: 'VIDEO GAMES', icon: '/static/industries/video-games.png', download: '/static/Download-icon.png', generic: ['/static/example.xlsx'], active: true},
    {name: 'MORE', icon: '/static/industries/more-icon.png', download: '/static/Download-icon.png', generic: '/static/example.xlsx', active: true}
];

const defaultValue = {
    languagesDefault,
    requestsDefault,
    usersDefault,
    servicesDefault,
    industriesDefault
};


module.exports = defaultValue;