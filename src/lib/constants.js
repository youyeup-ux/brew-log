export const BEAN_TYPES = {
  single_origin: '싱글 오리진',
  blend: '블랜드',
}

export const ROAST_LEVELS = {
  light: '라이트',
  medium_light: '미디엄 라이트',
  medium: '미디엄',
  medium_dark: '미디엄 다크',
  dark: '다크',
}

export const DRINK_TYPES = {
  espresso:       { label: '에스프레소',        hasWater: false, hasMilk: false, hasIce: false },
  americano_hot:  { label: '아메리카노(HOT)',   hasWater: true,  hasMilk: false, hasIce: false },
  americano_iced: { label: '아메리카노(ICE)',   hasWater: true,  hasMilk: false, hasIce: true  },
  latte_hot:      { label: '카페라떼(HOT)',     hasWater: false, hasMilk: true,  hasIce: false },
  latte_iced:     { label: '카페라떼(ICE)',     hasWater: false, hasMilk: true,  hasIce: true  },
}

export const TASTE_FIELDS = [
  { key: 'taste_overall',    label: '전체' },
  { key: 'taste_acidity',    label: '산미' },
  { key: 'taste_bitterness', label: '쓴맛' },
  { key: 'taste_body',       label: '바디' },
  { key: 'taste_sweetness',  label: '단맛' },
]
