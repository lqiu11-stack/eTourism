import london from "../Pages/icon/London.png";
import iceland from "../Pages/icon/plane.png";
import paris from "../Pages/icon/paris.png";
import japan from "../Pages/icon/japan.png";
import china from "../Pages/icon/china.png";
import philippine from "../Pages/icon/Philippine.png";
import korea from "../Pages/icon/korea.png";
import singapore from "../Pages/icon/Singapore.png";
import thai from "../Pages/icon/thai.png";

export const countryImageMap = {
  'United Kingdom': london,
  'Iceland': iceland,
  'France': paris,
  'Japan': japan,
  'China': china,
  'Philippines': philippine,
  'South Korea': korea,
  'Singapore': singapore,
  'Thailand': thai,
};

export const getCountryImage = (country) => countryImageMap[country] || london;
