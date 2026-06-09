export const PRICING_MODES = {
  UNIFORM: 'uniform',
  CUSTOM: 'custom',
}

export const PRICING_MODE_OPTIONS = [
  {
    value: PRICING_MODES.UNIFORM,
    label: 'Same price for all sizes',
    description: 'One price for all tiers. Set file size per tier.',
  },
  {
    value: PRICING_MODES.CUSTOM,
    label: 'Different price per size',
    description: 'Set file size and a unique price for each tier.',
  },
]
