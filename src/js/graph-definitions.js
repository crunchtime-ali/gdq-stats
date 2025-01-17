import { format } from 'd3-format'

const fullNumber = format(',.0f')
const fullNumberCurrency = format('$,.0f')

const GRAPHS = [
  {
    name: 'Viewers',
    key: 'v',
    format: fullNumber
  },
  {
    name: 'Donations',
    key: 'm',
    format: format('$,.2s'),
    tooltipFormat: fullNumberCurrency
  },
  {
    name: 'Donations per minute',
    key: 'm_drv',
    format: fullNumberCurrency,
    movingAverage: true,
    movingAverageScale: 0.5,
    percentile: 99
  },
  {
    name: 'Donors',
    key: 'd',
    format: fullNumber
  },
  {
    name: 'Tweets',
    key: 't_acc',
    format: format(',.2s'),
    tooltipFormat: fullNumber
  },
  {
    name: 'Tweets per minute',
    key: 't',
    format: fullNumber,
    movingAverage: true
  },
  {
    name: 'Twitch Chats',
    key: 'c_acc',
    format: format(',.2s'),
    tooltipFormat: fullNumber
  },
  {
    name: 'Twitch Chats per minute',
    key: 'c',
    format: fullNumber,
    movingAverage: true
  }
]

export default GRAPHS
