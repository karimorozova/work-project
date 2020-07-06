const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
    trim: true
  },
  nativeLanguage: {
    type: Schema.Types.ObjectID, ref: 'Language'
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    default: '',
    trim: true
  },
  contract: {
    type: String,
    default: '',
    trim: true
  },
  nda: {
    type: String,
    default: '',
    trim: true
  },
  timeZone: {
    type: Schema.Types.ObjectID, ref: 'Timezones'
  },
  documents: [{
    fileName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    }
  }],
  accountManager: {
    type: Object,
    default: {}
  },
  salesManager: {
    type: Object,
    default: {}
  },
  projectManager: {
    type: Object,
    default: {}
  },
  leadSource: {
    type: String,
    default: '',
    trim: true
  },
  leadGeneration: {
    type: String,
    default: '',
    trim: true
  },
  salesStage: {
    type: String,
    default: '',
    trim: true
  },
  salesComission: {
    type: String,
    default: '',
    trim: true
  },
  officialName: {
    type: String,
    default: '',
    trim: true
  },
  contactName: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true
  },
  isTest: {
    type: Boolean,
    default: false
  },
  billingInfo: {
    officialCompanyName: {
      type: String,
      trim: true
    },
    contactName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    vat: {
      type: Boolean,
      default: false
    },
    dueDate: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    invoiceSending: {
      type: Boolean,
      default: false,
    },
    paymentType: {
      type: String,
      trim: true,
    },
    startingBalance: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 0
    },
    minimumBalance: {
      type: Number,
      default: 0
    }
  },
  languagePairs: [{
    source: {
      type: Schema.Types.ObjectId, ref: 'Language'
    },
    target: {
      type: Schema.Types.ObjectId, ref: 'Language'
    }
  }],
  wordsRates: [{
    source: {
      type: Schema.Types.ObjectId, ref: 'Language',
    },
    target: {
      type: Schema.Types.ObjectId, ref: 'Language'
    },
    industries: [{
      type: Schema.Types.ObjectId, ref: 'Industries'
    }],
    rates: {
      type: Object,
      default: {}
    }
  }],
  hoursRates: [{
    source: {
      type: Schema.Types.ObjectId, ref: 'Language',
    },
    target: {
      type: Schema.Types.ObjectId, ref: 'Language'
    },
    industries: [{
      type: Schema.Types.ObjectId, ref: 'Industries'
    }],
    rates: {
      type: Object,
      default: {}
    }
  }],
  monoRates: [{
    target: {
      type: Schema.Types.ObjectId, ref: 'Language'
    },
    packageSize: {
      type: String,
      trim: true
    },
    industries: [{
      type: Schema.Types.ObjectId, ref: 'Industries'
    }],
    rates: {
      type: Object,
      default: {}
    }
  }],
  industries: [
    { type: Schema.Types.ObjectId, ref: 'Industries' }
  ],
  services: [{
    sourceLanguage: {
      type: Schema.Types.ObjectId, ref: 'Language',
    },
    targetLanguage: {
      type: Schema.Types.ObjectId, ref: 'Language',
    },
    service: {
      type: Schema.Types.ObjectId, ref: 'Services',
    },
    industry: {
      type: Schema.Types.ObjectId, ref: 'Industries',
    }
  }],
  rates: {
    basicPricesTable: [{
      type: {
        type: String,
        trim: true
      },
      sourceLanguage: {
        type: Schema.Types.ObjectId, ref: 'Language',
      },
      targetLanguage: {
        type: Schema.Types.ObjectId, ref: 'Language',
      },
      euroBasicPrice: {
        type: Number,
        default: 1,
      }
    }],
    stepMultipliersTable: [{
      step: {
        type: Schema.Types.ObjectId, ref: 'Step',
      },
      unit: {
        type: Schema.Types.ObjectId, ref: 'Units',
      },
      size: {
        type: Number,
      },
      multiplier: {
        type: Number,
        default: 100,
      },
      euroMinPrice: {
        type: Number,
        default: 1,
      }
    }],
    industryMultipliersTable: [{
      industry: {
        type: Schema.Types.ObjectId, ref: 'Industries',
      },
      multiplier: {
        type: Number,
        default: 100,
      }
    }],
  },
  contacts: [{
    country: "",
    timezone: "",
    firstName: "",
    surname: "",
    email: "",
    password: "",
    gender: "",
    phone: "",
    photo: "",
    skype: "",
    position: "",
    notes: "",
    leadContact: false
  }],
  matrix: {
    type: Object,
    default: {
      xTranslated: { text: "X translated", rate: 0.25 },
      repeat: { text: "Repetition", rate: 0.3 },
      contextMatch: { text: "Context match", value: 0.3 },
      repeat100: { text: "100%", rate: 0.3 },
      repeat50: { text: "50-74%", rate: 1 },
      repeat75: { text: "75-84%", rate: 0.9 },
      repeat85: { text: "85-94%", rate: 0.7 },
      repeat95: { text: "95-99%", rate: 0.4 },
      noMatch: { text: "No match", rate: 1 }
    }
  },
  otherInfo: {
    firstContactDate: {
      type: String,
      trim: true
    },
    firstQuoteDate: {
      type: String,
      trim: true
    },
    lastQuoteDate: {
      type: String,
      trim: true
    },
    firstProjectDate: {
      type: String,
      trim: true
    },
    lastProjectDate: {
      type: String,
      trim: true
    }
  }
}, { minimize: false });

ClientSchema.statics.authenticate = function (email, password, callback) {
  Clients.findOne({ "contacts.email": email })
    .exec((err, client) => {
      if (err) {
        return callback(err);
      } else if (!client) {
        const err = new Error('Client not found.');
        err.status = 401;
        return callback(err);
      }

      const contact = client.contacts.find((contact) => contact.email === email);
      bcrypt.compare(password, contact.password, function (err, result) {
        if (result === true || !contact.password) {
          return callback(null, { client, contact });
        } else {
          return callback();
        }
      });
    });
};

const Clients = mongoose.model('Clients', ClientSchema);

module.exports = Clients;
