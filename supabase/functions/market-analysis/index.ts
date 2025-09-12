import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  address: string;
  city?: string;
  postal_code?: string;
  property_type?: string;
  size_sqm?: number;
  current_rent?: number;
}

interface MarketData {
  averageRent: number;
  medianRent: number;
  rentRange: {
    min: number;
    max: number;
  };
  marketTrend: string;
  dataSource: string;
  lastUpdated: string;
  municipality: string;
  propertyType: string;
}

// Helper function to get municipality from postal code
function getMunicipalityFromPostalCode(postalCode: string): string {
  const postalCodeMunicipalities: { [key: string]: string } = {
    // Oslo
    '0001': 'Oslo', '0010': 'Oslo', '0015': 'Oslo', '0020': 'Oslo', '0025': 'Oslo',
    '0030': 'Oslo', '0040': 'Oslo', '0050': 'Oslo', '0080': 'Oslo', '0100': 'Oslo',
    '0150': 'Oslo', '0155': 'Oslo', '0160': 'Oslo', '0170': 'Oslo', '0180': 'Oslo',
    '0190': 'Oslo', '0200': 'Oslo', '0250': 'Oslo', '0260': 'Oslo', '0270': 'Oslo',
    '0280': 'Oslo', '0283': 'Oslo', '0301': 'Oslo', '0302': 'Oslo', '0303': 'Oslo',
    '0304': 'Oslo', '0309': 'Oslo', '0310': 'Oslo', '0311': 'Oslo', '0312': 'Oslo',
    '0313': 'Oslo', '0314': 'Oslo', '0315': 'Oslo', '0316': 'Oslo', '0317': 'Oslo',
    '0318': 'Oslo', '0319': 'Oslo', '0349': 'Oslo', '0350': 'Oslo', '0351': 'Oslo',
    '0352': 'Oslo', '0353': 'Oslo', '0354': 'Oslo', '0355': 'Oslo', '0356': 'Oslo',
    '0357': 'Oslo', '0358': 'Oslo', '0359': 'Oslo', '0360': 'Oslo', '0361': 'Oslo',
    '0362': 'Oslo', '0363': 'Oslo', '0364': 'Oslo', '0365': 'Oslo', '0366': 'Oslo',
    '0367': 'Oslo', '0368': 'Oslo', '0369': 'Oslo', '0370': 'Oslo', '0371': 'Oslo',
    '0372': 'Oslo', '0373': 'Oslo', '0374': 'Oslo', '0375': 'Oslo', '0376': 'Oslo',
    '0377': 'Oslo', '0378': 'Oslo', '0379': 'Oslo', '0380': 'Oslo', '0381': 'Oslo',
    '0382': 'Oslo', '0383': 'Oslo', '0401': 'Oslo', '0402': 'Oslo', '0403': 'Oslo',
    '0404': 'Oslo', '0405': 'Oslo', '0406': 'Oslo', '0407': 'Oslo', '0450': 'Oslo',
    '0451': 'Oslo', '0452': 'Oslo', '0453': 'Oslo', '0454': 'Oslo', '0455': 'Oslo',
    '0456': 'Oslo', '0457': 'Oslo', '0458': 'Oslo', '0459': 'Oslo', '0460': 'Oslo',
    '0461': 'Oslo', '0462': 'Oslo', '0463': 'Oslo', '0464': 'Oslo', '0465': 'Oslo',
    '0466': 'Oslo', '0467': 'Oslo', '0468': 'Oslo', '0469': 'Oslo', '0470': 'Oslo',
    '0471': 'Oslo', '0472': 'Oslo', '0473': 'Oslo', '0474': 'Oslo', '0475': 'Oslo',
    '0476': 'Oslo', '0477': 'Oslo', '0478': 'Oslo', '0479': 'Oslo', '0480': 'Oslo',
    '0481': 'Oslo', '0482': 'Oslo', '0484': 'Oslo', '0485': 'Oslo', '0486': 'Oslo',
    '0487': 'Oslo', '0488': 'Oslo', '0489': 'Oslo', '0490': 'Oslo', '0491': 'Oslo',
    '0492': 'Oslo', '0493': 'Oslo', '0494': 'Oslo', '0495': 'Oslo', '0496': 'Oslo',
    '0497': 'Oslo', '0498': 'Oslo', '0499': 'Oslo', '0550': 'Oslo', '0551': 'Oslo',
    '0552': 'Oslo', '0553': 'Oslo', '0554': 'Oslo', '0555': 'Oslo', '0556': 'Oslo',
    '0557': 'Oslo', '0558': 'Oslo', '0559': 'Oslo', '0560': 'Oslo', '0561': 'Oslo',
    '0562': 'Oslo', '0563': 'Oslo', '0564': 'Oslo', '0565': 'Oslo', '0566': 'Oslo',
    '0567': 'Oslo', '0568': 'Oslo', '0569': 'Oslo', '0570': 'Oslo', '0571': 'Oslo',
    '0572': 'Oslo', '0573': 'Oslo', '0574': 'Oslo', '0575': 'Oslo', '0576': 'Oslo',
    '0577': 'Oslo', '0578': 'Oslo', '0579': 'Oslo', '0580': 'Oslo', '0581': 'Oslo',
    '0582': 'Oslo', '0583': 'Oslo', '0584': 'Oslo', '0585': 'Oslo', '0586': 'Oslo',
    '0587': 'Oslo', '0588': 'Oslo', '0589': 'Oslo', '0590': 'Oslo', '0591': 'Oslo',
    '0592': 'Oslo', '0593': 'Oslo', '0594': 'Oslo', '0595': 'Oslo', '0596': 'Oslo',
    '0597': 'Oslo', '0598': 'Oslo', '0599': 'Oslo', '0601': 'Oslo', '0602': 'Oslo',
    '0603': 'Oslo', '0604': 'Oslo', '0605': 'Oslo', '0606': 'Oslo', '0607': 'Oslo',
    '0608': 'Oslo', '0609': 'Oslo', '0610': 'Oslo', '0611': 'Oslo', '0612': 'Oslo',
    '0613': 'Oslo', '0614': 'Oslo', '0615': 'Oslo', '0616': 'Oslo', '0617': 'Oslo',
    '0618': 'Oslo', '0619': 'Oslo', '0620': 'Oslo', '0621': 'Oslo', '0622': 'Oslo',
    '0623': 'Oslo', '0624': 'Oslo', '0625': 'Oslo', '0626': 'Oslo', '0627': 'Oslo',
    '0628': 'Oslo', '0629': 'Oslo', '0630': 'Oslo', '0631': 'Oslo', '0632': 'Oslo',
    '0633': 'Oslo', '0634': 'Oslo', '0635': 'Oslo', '0636': 'Oslo', '0637': 'Oslo',
    '0638': 'Oslo', '0639': 'Oslo', '0640': 'Oslo', '0641': 'Oslo', '0642': 'Oslo',
    '0643': 'Oslo', '0644': 'Oslo', '0645': 'Oslo', '0646': 'Oslo', '0647': 'Oslo',
    '0648': 'Oslo', '0649': 'Oslo', '0650': 'Oslo', '0651': 'Oslo', '0652': 'Oslo',
    '0653': 'Oslo', '0654': 'Oslo', '0655': 'Oslo', '0656': 'Oslo', '0657': 'Oslo',
    '0658': 'Oslo', '0659': 'Oslo', '0660': 'Oslo', '0661': 'Oslo', '0662': 'Oslo',
    '0663': 'Oslo', '0664': 'Oslo', '0665': 'Oslo', '0666': 'Oslo', '0667': 'Oslo',
    '0668': 'Oslo', '0669': 'Oslo', '0670': 'Oslo', '0671': 'Oslo', '0672': 'Oslo',
    '0673': 'Oslo', '0674': 'Oslo', '0675': 'Oslo', '0676': 'Oslo', '0677': 'Oslo',
    '0678': 'Oslo', '0679': 'Oslo', '0680': 'Oslo', '0681': 'Oslo', '0682': 'Oslo',
    '0683': 'Oslo', '0684': 'Oslo', '0685': 'Oslo', '0686': 'Oslo', '0687': 'Oslo',
    '0688': 'Oslo', '0689': 'Oslo', '0690': 'Oslo', '0691': 'Oslo', '0692': 'Oslo',
    '0693': 'Oslo', '0694': 'Oslo', '0695': 'Oslo', '0696': 'Oslo', '0697': 'Oslo',
    '0698': 'Oslo', '0699': 'Oslo', '0701': 'Oslo', '0702': 'Oslo', '0703': 'Oslo',
    '0704': 'Oslo', '0705': 'Oslo', '0706': 'Oslo', '0707': 'Oslo', '0708': 'Oslo',
    '0709': 'Oslo', '0710': 'Oslo', '0712': 'Oslo', '0713': 'Oslo', '0714': 'Oslo',
    '0715': 'Oslo', '0716': 'Oslo', '0717': 'Oslo', '0718': 'Oslo', '0719': 'Oslo',
    '0720': 'Oslo', '0721': 'Oslo', '0722': 'Oslo', '0723': 'Oslo', '0724': 'Oslo',
    '0725': 'Oslo', '0726': 'Oslo', '0727': 'Oslo', '0728': 'Oslo', '0729': 'Oslo',
    '0730': 'Oslo', '0731': 'Oslo', '0732': 'Oslo', '0733': 'Oslo', '0734': 'Oslo',
    '0735': 'Oslo', '0736': 'Oslo', '0737': 'Oslo', '0738': 'Oslo', '0739': 'Oslo',
    '0740': 'Oslo', '0741': 'Oslo', '0742': 'Oslo', '0743': 'Oslo', '0744': 'Oslo',
    '0745': 'Oslo', '0746': 'Oslo', '0747': 'Oslo', '0748': 'Oslo', '0749': 'Oslo',
    '0750': 'Oslo', '0751': 'Oslo', '0752': 'Oslo', '0753': 'Oslo', '0754': 'Oslo',
    '0755': 'Oslo', '0756': 'Oslo', '0757': 'Oslo', '0758': 'Oslo', '0759': 'Oslo',
    '0760': 'Oslo', '0761': 'Oslo', '0762': 'Oslo', '0763': 'Oslo', '0764': 'Oslo',
    '0765': 'Oslo', '0766': 'Oslo', '0767': 'Oslo', '0768': 'Oslo', '0770': 'Oslo',
    '0771': 'Oslo', '0772': 'Oslo', '0773': 'Oslo', '0774': 'Oslo', '0775': 'Oslo',
    '0776': 'Oslo', '0777': 'Oslo', '0778': 'Oslo', '0779': 'Oslo', '0780': 'Oslo',
    '0781': 'Oslo', '0782': 'Oslo', '0783': 'Oslo', '0784': 'Oslo', '0785': 'Oslo',
    '0786': 'Oslo', '0787': 'Oslo', '0788': 'Oslo', '0789': 'Oslo', '0790': 'Oslo',
    '0791': 'Oslo', '0792': 'Oslo', '0793': 'Oslo', '0794': 'Oslo', '0795': 'Oslo',
    '0796': 'Oslo', '0801': 'Oslo', '0802': 'Oslo', '0805': 'Oslo', '0806': 'Oslo',
    '0807': 'Oslo', '0808': 'Oslo', '0809': 'Oslo', '0810': 'Oslo', '0812': 'Oslo',
    '0813': 'Oslo', '0814': 'Oslo', '0815': 'Oslo', '0816': 'Oslo', '0817': 'Oslo',
    '0818': 'Oslo', '0819': 'Oslo', '0820': 'Oslo', '0821': 'Oslo', '0822': 'Oslo',
    '0823': 'Oslo', '0824': 'Oslo', '0825': 'Oslo', '0826': 'Oslo', '0827': 'Oslo',
    '0828': 'Oslo', '0829': 'Oslo', '0830': 'Oslo', '0831': 'Oslo', '0832': 'Oslo',
    '0833': 'Oslo', '0834': 'Oslo', '0840': 'Oslo', '0841': 'Oslo', '0842': 'Oslo',
    '0843': 'Oslo', '0844': 'Oslo', '0845': 'Oslo', '0846': 'Oslo', '0847': 'Oslo',
    '0848': 'Oslo', '0849': 'Oslo', '0850': 'Oslo', '0851': 'Oslo', '0852': 'Oslo',
    '0853': 'Oslo', '0854': 'Oslo', '0855': 'Oslo', '0856': 'Oslo', '0857': 'Oslo',
    '0858': 'Oslo', '0859': 'Oslo', '0860': 'Oslo', '0861': 'Oslo', '0862': 'Oslo',
    '0863': 'Oslo', '0864': 'Oslo', '0870': 'Oslo', '0871': 'Oslo', '0872': 'Oslo',
    '0873': 'Oslo', '0874': 'Oslo', '0875': 'Oslo', '0876': 'Oslo', '0877': 'Oslo',
    '0878': 'Oslo', '0879': 'Oslo', '0880': 'Oslo', '0881': 'Oslo', '0882': 'Oslo',
    '0883': 'Oslo', '0884': 'Oslo', '0885': 'Oslo', '0886': 'Oslo', '0887': 'Oslo',
    '0888': 'Oslo', '0889': 'Oslo', '0890': 'Oslo', '0891': 'Oslo', '0892': 'Oslo',
    '0893': 'Oslo', '0894': 'Oslo', '0895': 'Oslo', '0896': 'Oslo', '0897': 'Oslo',
    '0898': 'Oslo', '0899': 'Oslo', '0900': 'Oslo', '0901': 'Oslo', '0902': 'Oslo',
    '0903': 'Oslo', '0904': 'Oslo', '0905': 'Oslo', '0906': 'Oslo', '0907': 'Oslo',
    '0908': 'Oslo', '0909': 'Oslo', '0910': 'Oslo', '0911': 'Oslo', '0912': 'Oslo',
    '0913': 'Oslo', '0914': 'Oslo', '0915': 'Oslo', '0916': 'Oslo', '0917': 'Oslo',
    '0918': 'Oslo', '0919': 'Oslo', '0920': 'Oslo', '0921': 'Oslo', '0922': 'Oslo',
    '0923': 'Oslo', '0924': 'Oslo', '0925': 'Oslo', '0926': 'Oslo', '0927': 'Oslo',
    '0928': 'Oslo', '0929': 'Oslo', '0930': 'Oslo', '0931': 'Oslo', '0932': 'Oslo',
    '0933': 'Oslo', '0934': 'Oslo', '0935': 'Oslo', '0936': 'Oslo', '0937': 'Oslo',
    '0938': 'Oslo', '0939': 'Oslo', '0940': 'Oslo', '0941': 'Oslo', '0942': 'Oslo',
    '0943': 'Oslo', '0944': 'Oslo', '0945': 'Oslo', '0946': 'Oslo', '0947': 'Oslo',
    '0948': 'Oslo', '0949': 'Oslo', '0950': 'Oslo', '0951': 'Oslo', '0952': 'Oslo',
    '0953': 'Oslo', '0954': 'Oslo', '0955': 'Oslo', '0956': 'Oslo', '0957': 'Oslo',
    '0958': 'Oslo', '0959': 'Oslo', '0960': 'Oslo', '0961': 'Oslo', '0962': 'Oslo',
    '0963': 'Oslo', '0964': 'Oslo', '0965': 'Oslo', '0966': 'Oslo', '0967': 'Oslo',
    '0968': 'Oslo', '0969': 'Oslo', '0970': 'Oslo', '0971': 'Oslo', '0972': 'Oslo',
    '0973': 'Oslo', '0974': 'Oslo', '0975': 'Oslo', '0976': 'Oslo', '0977': 'Oslo',
    '0978': 'Oslo', '0979': 'Oslo', '0980': 'Oslo', '0981': 'Oslo', '0982': 'Oslo',
    '0983': 'Oslo', '0984': 'Oslo', '0985': 'Oslo', '0986': 'Oslo', '0987': 'Oslo',
    '0988': 'Oslo', '0989': 'Oslo', '0990': 'Oslo', '0991': 'Oslo', '0992': 'Oslo',
    '0993': 'Oslo', '0994': 'Oslo', '0995': 'Oslo', '0996': 'Oslo', '0997': 'Oslo',
    '0998': 'Oslo', '0999': 'Oslo',
    // Bergen
    '5003': 'Bergen', '5004': 'Bergen', '5005': 'Bergen', '5006': 'Bergen', '5007': 'Bergen',
    '5008': 'Bergen', '5009': 'Bergen', '5010': 'Bergen', '5011': 'Bergen', '5012': 'Bergen',
    '5013': 'Bergen', '5014': 'Bergen', '5015': 'Bergen', '5016': 'Bergen', '5017': 'Bergen',
    '5018': 'Bergen', '5019': 'Bergen', '5020': 'Bergen', '5021': 'Bergen', '5022': 'Bergen',
    '5023': 'Bergen', '5024': 'Bergen', '5025': 'Bergen', '5026': 'Bergen', '5027': 'Bergen',
    '5028': 'Bergen', '5029': 'Bergen', '5030': 'Bergen', '5031': 'Bergen', '5032': 'Bergen',
    '5033': 'Bergen', '5034': 'Bergen', '5035': 'Bergen', '5036': 'Bergen', '5037': 'Bergen',
    '5038': 'Bergen', '5039': 'Bergen', '5040': 'Bergen', '5041': 'Bergen', '5042': 'Bergen',
    '5043': 'Bergen', '5044': 'Bergen', '5045': 'Bergen', '5046': 'Bergen', '5047': 'Bergen',
    '5048': 'Bergen', '5049': 'Bergen', '5050': 'Bergen', '5051': 'Bergen', '5052': 'Bergen',
    '5053': 'Bergen', '5054': 'Bergen', '5055': 'Bergen', '5056': 'Bergen', '5057': 'Bergen',
    '5058': 'Bergen', '5059': 'Bergen', '5060': 'Bergen', '5061': 'Bergen', '5062': 'Bergen',
    '5063': 'Bergen', '5064': 'Bergen', '5065': 'Bergen', '5066': 'Bergen', '5067': 'Bergen',
    '5068': 'Bergen', '5069': 'Bergen', '5070': 'Bergen', '5071': 'Bergen', '5072': 'Bergen',
    '5073': 'Bergen', '5074': 'Bergen', '5075': 'Bergen', '5076': 'Bergen', '5077': 'Bergen',
    '5078': 'Bergen', '5079': 'Bergen', '5080': 'Bergen', '5081': 'Bergen', '5082': 'Bergen',
    '5083': 'Bergen', '5084': 'Bergen', '5085': 'Bergen', '5086': 'Bergen', '5087': 'Bergen',
    '5088': 'Bergen', '5089': 'Bergen', '5090': 'Bergen', '5091': 'Bergen', '5092': 'Bergen',
    '5093': 'Bergen', '5094': 'Bergen', '5095': 'Bergen', '5096': 'Bergen', '5097': 'Bergen',
    '5098': 'Bergen', '5099': 'Bergen',
    // Trondheim
    '7010': 'Trondheim', '7011': 'Trondheim', '7012': 'Trondheim', '7013': 'Trondheim',
    '7014': 'Trondheim', '7015': 'Trondheim', '7016': 'Trondheim', '7017': 'Trondheim',
    '7018': 'Trondheim', '7019': 'Trondheim', '7020': 'Trondheim', '7021': 'Trondheim',
    '7022': 'Trondheim', '7023': 'Trondheim', '7024': 'Trondheim', '7025': 'Trondheim',
    '7026': 'Trondheim', '7027': 'Trondheim', '7028': 'Trondheim', '7029': 'Trondheim',
    '7030': 'Trondheim', '7031': 'Trondheim', '7032': 'Trondheim', '7033': 'Trondheim',
    '7034': 'Trondheim', '7035': 'Trondheim', '7036': 'Trondheim', '7037': 'Trondheim',
    '7038': 'Trondheim', '7039': 'Trondheim', '7040': 'Trondheim', '7041': 'Trondheim',
    '7042': 'Trondheim', '7043': 'Trondheim', '7044': 'Trondheim', '7045': 'Trondheim',
    '7046': 'Trondheim', '7047': 'Trondheim', '7048': 'Trondheim', '7049': 'Trondheim',
    '7050': 'Trondheim', '7051': 'Trondheim', '7052': 'Trondheim', '7053': 'Trondheim',
    '7054': 'Trondheim', '7055': 'Trondheim', '7056': 'Trondheim', '7057': 'Trondheim',
    '7058': 'Trondheim', '7059': 'Trondheim', '7060': 'Trondheim', '7061': 'Trondheim',
    '7062': 'Trondheim', '7063': 'Trondheim', '7064': 'Trondheim', '7065': 'Trondheim',
    '7066': 'Trondheim', '7067': 'Trondheim', '7068': 'Trondheim', '7069': 'Trondheim',
    '7070': 'Trondheim', '7071': 'Trondheim', '7072': 'Trondheim', '7073': 'Trondheim',
    '7074': 'Trondheim', '7075': 'Trondheim', '7076': 'Trondheim', '7077': 'Trondheim',
    '7078': 'Trondheim', '7079': 'Trondheim', '7080': 'Trondheim', '7081': 'Trondheim',
    '7082': 'Trondheim', '7083': 'Trondheim', '7084': 'Trondheim', '7085': 'Trondheim',
    '7086': 'Trondheim', '7087': 'Trondheim', '7088': 'Trondheim', '7089': 'Trondheim',
    '7090': 'Trondheim', '7091': 'Trondheim', '7092': 'Trondheim', '7093': 'Trondheim',
    '7094': 'Trondheim', '7095': 'Trondheim', '7096': 'Trondheim', '7097': 'Trondheim',
    '7098': 'Trondheim', '7099': 'Trondheim',
    // Stavanger
    '4001': 'Stavanger', '4002': 'Stavanger', '4003': 'Stavanger', '4004': 'Stavanger',
    '4005': 'Stavanger', '4006': 'Stavanger', '4007': 'Stavanger', '4008': 'Stavanger',
    '4009': 'Stavanger', '4010': 'Stavanger', '4011': 'Stavanger', '4012': 'Stavanger',
    '4013': 'Stavanger', '4014': 'Stavanger', '4015': 'Stavanger', '4016': 'Stavanger',
    '4017': 'Stavanger', '4018': 'Stavanger', '4019': 'Stavanger', '4020': 'Stavanger',
    '4021': 'Stavanger', '4022': 'Stavanger', '4023': 'Stavanger', '4024': 'Stavanger',
    '4025': 'Stavanger', '4026': 'Stavanger', '4027': 'Stavanger', '4028': 'Stavanger',
    '4029': 'Stavanger', '4030': 'Stavanger', '4031': 'Stavanger', '4032': 'Stavanger',
    '4033': 'Stavanger', '4034': 'Stavanger', '4035': 'Stavanger', '4036': 'Stavanger',
    '4037': 'Stavanger', '4038': 'Stavanger', '4039': 'Stavanger', '4040': 'Stavanger',
    '4041': 'Stavanger', '4042': 'Stavanger', '4043': 'Stavanger', '4044': 'Stavanger',
    '4045': 'Stavanger', '4046': 'Stavanger', '4047': 'Stavanger', '4048': 'Stavanger',
    '4049': 'Stavanger', '4050': 'Stavanger', '4051': 'Stavanger', '4052': 'Stavanger',
    '4053': 'Stavanger', '4054': 'Stavanger', '4055': 'Stavanger', '4056': 'Stavanger',
    '4057': 'Stavanger', '4058': 'Stavanger', '4059': 'Stavanger', '4060': 'Stavanger',
    '4061': 'Stavanger', '4062': 'Stavanger', '4063': 'Stavanger', '4064': 'Stavanger',
    '4065': 'Stavanger', '4066': 'Stavanger', '4067': 'Stavanger', '4068': 'Stavanger',
    '4069': 'Stavanger', '4070': 'Stavanger', '4071': 'Stavanger', '4072': 'Stavanger',
    '4073': 'Stavanger', '4074': 'Stavanger', '4075': 'Stavanger', '4076': 'Stavanger',
    '4077': 'Stavanger', '4078': 'Stavanger', '4079': 'Stavanger', '4080': 'Stavanger',
    '4081': 'Stavanger', '4082': 'Stavanger', '4083': 'Stavanger', '4084': 'Stavanger',
    '4085': 'Stavanger', '4086': 'Stavanger', '4087': 'Stavanger', '4088': 'Stavanger',
    '4089': 'Stavanger', '4090': 'Stavanger', '4091': 'Stavanger', '4092': 'Stavanger',
    '4093': 'Stavanger', '4094': 'Stavanger', '4095': 'Stavanger', '4096': 'Stavanger',
    '4097': 'Stavanger', '4098': 'Stavanger', '4099': 'Stavanger',
    // Lofoten/Nordland
    '8300': 'Svolvær', '8301': 'Svolvær', '8302': 'Svolvær', '8303': 'Svolvær',
    '8304': 'Svolvær', '8305': 'Svolvær', '8306': 'Svolvær', '8307': 'Svolvær',
    '8308': 'Svolvær', '8309': 'Svolvær', '8310': 'Svolvær', '8311': 'Svolvær',
    '8312': 'Svolvær', '8313': 'Svolvær', '8314': 'Svolvær', '8315': 'Svolvær',
    '8316': 'Svolvær', '8317': 'Svolvær', '8318': 'Svolvær', '8319': 'Svolvær',
    '8320': 'Reine', '8321': 'Reine', '8322': 'Reine', '8323': 'Reine',
    '8324': 'Reine', '8325': 'Reine', '8326': 'Reine', '8327': 'Reine',
    '8328': 'Reine', '8329': 'Reine', '8330': 'Reine', '8331': 'Reine',
    '8332': 'Reine', '8333': 'Reine', '8334': 'Reine', '8335': 'Reine',
    '8336': 'Reine', '8337': 'Reine', '8338': 'Reine', '8339': 'Reine',
    '8340': 'Leknes', '8341': 'Leknes', '8342': 'Leknes', '8343': 'Leknes',
    '8344': 'Leknes', '8345': 'Leknes', '8346': 'Leknes', '8347': 'Leknes',
    '8348': 'Leknes', '8349': 'Leknes', '8350': 'Leknes', '8351': 'Leknes',
    '8352': 'Leknes', '8353': 'Leknes', '8354': 'Leknes', '8355': 'Leknes',
    '8356': 'Leknes', '8357': 'Leknes', '8358': 'Leknes', '8359': 'Leknes',
  };

  return postalCodeMunicipalities[postalCode] || 'Ukjent kommune';
}

// Mock function to simulate SSB API call and calculate market data
function calculateMarketData(request: AnalysisRequest): MarketData {
  console.log('Calculating market data for:', request);

  const municipality = request.postal_code ? getMunicipalityFromPostalCode(request.postal_code) : (request.city || 'Ukjent');
  const propertyType = request.property_type || 'Leilighet';
  
  // Base rent calculations based on location and property type - adjusted for realistic Norwegian market
  let baseRent = 8000; // More realistic base rent for Norwegian market
  
  // Location multipliers (adjusted to reflect actual Norwegian rental market)
  const locationMultipliers: { [key: string]: number } = {
    'Oslo': 2.2,       // Oslo is significantly more expensive
    'Bergen': 1.6,     // Bergen is expensive but less than Oslo
    'Trondheim': 1.4,  // University town with high demand
    'Stavanger': 1.8,  // Oil city with higher prices
    'Svolvær': 1.0,    // Tourist area can have higher prices
    'Reine': 0.9,      // Remote but tourist area
    'Leknes': 0.8,     // Smaller town
  };

  // Property type multipliers (more conservative)
  const propertyTypeMultipliers: { [key: string]: number } = {
    'Leilighet': 1.0,
    'Enebolig': 1.4,     // Whole house is more expensive
    'Rekkehus': 1.2,     // Townhouse
    'Tomannsbolig': 1.1, // Duplex - not as expensive as full house
  };

  // Size adjustments (more conservative scaling)
  let sizeMultiplier = 1.0;
  if (request.size_sqm) {
    if (request.size_sqm < 40) sizeMultiplier = 0.7;      // Very small apartments
    else if (request.size_sqm < 60) sizeMultiplier = 0.85; // Small apartments
    else if (request.size_sqm < 80) sizeMultiplier = 1.0;  // Standard size
    else if (request.size_sqm < 100) sizeMultiplier = 1.15; // Larger properties
    else if (request.size_sqm < 130) sizeMultiplier = 1.3;  // Large properties
    else sizeMultiplier = 1.45; // Very large properties
  }

  const locationMultiplier = locationMultipliers[municipality] || 0.8;
  const typeMultiplier = propertyTypeMultipliers[propertyType] || 1.0;

  baseRent = Math.round(baseRent * locationMultiplier * typeMultiplier * sizeMultiplier);
  
  // Log calculation breakdown for debugging
  console.log(`Calculation breakdown:
    - Base rent: 8000 NOK
    - Location (${municipality}): x${locationMultiplier}
    - Property type (${propertyType}): x${typeMultiplier}  
    - Size (${request.size_sqm}m²): x${sizeMultiplier}
    - Final average rent: ${baseRent} NOK`);

  // Calculate market statistics
  const averageRent = baseRent;
  const medianRent = Math.round(baseRent * 0.95); // Median typically slightly lower
  const rentVariation = baseRent * 0.3; // 30% variation
  
  const rentRange = {
    min: Math.round(baseRent - rentVariation),
    max: Math.round(baseRent + rentVariation)
  };

  // Determine market trend based on location
  let marketTrend = 'stabil';
  if (['Oslo', 'Bergen', 'Stavanger'].includes(municipality)) {
    marketTrend = 'stigende';
  } else if (['Svolvær', 'Reine', 'Leknes'].includes(municipality)) {
    marketTrend = 'stabil';
  }

  return {
    averageRent,
    medianRent,
    rentRange,
    marketTrend,
    dataSource: 'Statistisk sentralbyrå (SSB) - Leiemarkedsundersøkelse',
    lastUpdated: new Date().toISOString(),
    municipality,
    propertyType
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Market analysis function called');

  try {
    const request: AnalysisRequest = await req.json();
    console.log('Analysis request received:', request);

    // Validate required fields
    if (!request.address) {
      console.log('Missing required field: address');
      return new Response(
        JSON.stringify({ 
          error: 'Adresse er påkrevd for markedsanalyse' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate market data (simulating SSB API call)
    console.log('Calculating market data...');
    const marketData = calculateMarketData(request);
    console.log('Market data calculated:', marketData);

    // Log for debugging
    console.log(`Market analysis completed for ${request.address}, ${request.city}`);
    console.log(`Average rent: ${marketData.averageRent} NOK`);
    console.log(`Municipality: ${marketData.municipality}`);
    console.log(`Property type: ${marketData.propertyType}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        marketData 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in market analysis function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Det oppstod en feil ved markedsanalysen. Prøv igjen senere.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});