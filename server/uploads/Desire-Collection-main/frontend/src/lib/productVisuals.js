const TEMPLATE = {
  tshirt: '/templates/template-tshirt.png',
  hoodie: '/templates/template-hoodie.png',
  zipHoodie: '/templates/template-zip-hoodie.png',
  sweatshirt: '/templates/template-sweatshirt.png',
  oversized: '/templates/template-oversized-tshirt.png',
  crop: '/templates/template-crop-top.png',
  polo: '/templates/template-polo-shirt.png',
};

const PRODUCT_VISUALS_BY_ID = {
  // Local APPAREL_PRODUCTS ids
  prod_hoodie_001: TEMPLATE.hoodie,
  prod_tee_oversized_001: TEMPLATE.oversized,
  prod_tee_regular_001: TEMPLATE.tshirt,
  prod_sweatshirt_001: TEMPLATE.sweatshirt,
  prod_crop_001: TEMPLATE.crop,
  prod_long_sleeve_001: TEMPLATE.sweatshirt,
  prod_jacket_001: TEMPLATE.zipHoodie,
  prod_polo_001: TEMPLATE.polo,

  // Backend seeded ids
  prod_tshirt_basic_white: TEMPLATE.tshirt,
  prod_tshirt_vintage: TEMPLATE.tshirt,
  prod_tshirt_pocket: TEMPLATE.tshirt,
  prod_hoodie_classic: TEMPLATE.hoodie,
  prod_hoodie_zip: TEMPLATE.zipHoodie,
  prod_hoodie_oversized: TEMPLATE.hoodie,
  prod_oversized_basic: TEMPLATE.oversized,
  prod_oversized_streetwear: TEMPLATE.oversized,
  prod_oversized_graphic: TEMPLATE.oversized,
  prod_sweat_crewneck: TEMPLATE.sweatshirt,
  prod_sweat_vintage: TEMPLATE.sweatshirt,
  prod_sweat_embroidered: TEMPLATE.sweatshirt,
  prod_crop_basic: TEMPLATE.crop,
  prod_crop_athletic: TEMPLATE.crop,
  prod_crop_ribbed: TEMPLATE.crop,
  prod_premium_polo: TEMPLATE.polo,
};

const PRODUCT_VISUALS_BY_TYPE = {
  tshirt: TEMPLATE.tshirt,
  'oversized-tshirt': TEMPLATE.oversized,
  oversized_tshirt: TEMPLATE.oversized,
  oversized_tee: TEMPLATE.oversized,
  hoodie: TEMPLATE.hoodie,
  sweatshirt: TEMPLATE.sweatshirt,
  'crop-top': TEMPLATE.crop,
  crop_top: TEMPLATE.crop,
  long_sleeve: TEMPLATE.sweatshirt,
  jacket: TEMPLATE.zipHoodie,
  polo: TEMPLATE.polo,
};

const FALLBACK_VISUAL = TEMPLATE.tshirt;

const normalize = (value) => (value || '').toString().trim().toLowerCase();

export const resolveProductVisual = (product) => {
  if (!product) {
    return { imageUrl: FALLBACK_VISUAL, tintStrength: 0.5 };
  }

  const id = normalize(product.product_id);
  const type = normalize(product.type);
  const name = normalize(product.name);

  let imageUrl = PRODUCT_VISUALS_BY_ID[id] || PRODUCT_VISUALS_BY_TYPE[type];

  if (!imageUrl) {
    if (name.includes('zip')) imageUrl = TEMPLATE.zipHoodie;
    else if (name.includes('hoodie')) imageUrl = TEMPLATE.hoodie;
    else if (name.includes('oversized')) imageUrl = TEMPLATE.oversized;
    else if (name.includes('crop')) imageUrl = TEMPLATE.crop;
    else if (name.includes('polo')) imageUrl = TEMPLATE.polo;
    else if (name.includes('sweat')) imageUrl = TEMPLATE.sweatshirt;
    else imageUrl = TEMPLATE.tshirt;
  }

  return {
    imageUrl: imageUrl || FALLBACK_VISUAL,
    tintStrength: 0.5,
  };
};

export const normalizeColorHex = (color) => {
  if (!color || typeof color !== 'string') return '#e8e8e8';
  if (color.startsWith('#')) return color;
  return `#${color}`;
};
