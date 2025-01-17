import React from 'react'
import Stat from './Stat'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import Grid from 'react-bootstrap/lib/Grid'
import Col from 'react-bootstrap/lib/Col'
import { DONATION_TRACKER_URL, OFFLINE_MODE, VODS_URL } from '../constants'
import dayjs from 'dayjs'
import { gameEndTime } from '../utils'

const STATS = [
  {
    title: OFFLINE_MODE ? 'Max Viewers' : 'Viewers',
    emoji: '📺',
    key: 'viewers'
  },
  {
    title: 'Donations',
    emoji: '💸',
    key: 'donations',
    prefix: '$'
  },
  {
    title: 'Number of Donations',
    emoji: '🙌',
    key: 'donors'
  },
  {
    title: 'Games Completed',
    emoji: '🎮',
    key: 'games'
  },
  {
    title: 'Twitch Chats',
    emoji: '💬',
    key: 'chats'
  },
  {
    title: 'Tweets Tweeted',
    emoji: '🐦',
    key: 'tweets'
  }
]

class StatsContainer extends React.PureComponent {
  static propTypes = {
    timeseries: PropTypes.array.isRequired,
    timeseriesLoaded: PropTypes.bool.isRequired,
    schedule: PropTypes.array.isRequired
  }

  accumulateStats () {
    return this.props.timeseries.reduce(
      (prev, curr) => {
        return {
          c: prev.c + curr.c,
          e: prev.e + curr.e,
          t: prev.t + curr.t
        }
      },
      { c: 0, e: 0, t: 0 }
    )
  }

  getLatestData (timeseries, dataKey) {
    for (let i = timeseries.length - 1; i > 0; i--) {
      if (timeseries[i][dataKey] >= 0) {
        return timeseries[i][dataKey]
      }
    }
    return 0
  }

  getGamesCompleted () {
    return this.props.schedule.filter((g) => gameEndTime(g).isBefore(dayjs()))
      .length
  }

  getValues () {
    const accumulated = this.accumulateStats()

    let viewers = this.getLatestData(this.props.timeseries, 'v')

    // Display max viewers if in online mode
    if (OFFLINE_MODE) {
      viewers = this.props.timeseries.reduce(
        (prev, curr) => (prev > curr.v ? prev : curr.v),
        0
      )
    }

    const values = {
      viewers,
      donations: this.getLatestData(this.props.timeseries, 'm'),
      donors: this.getLatestData(this.props.timeseries, 'd'),
      chats: accumulated.c,
      tweets: accumulated.t,
      games: this.getGamesCompleted()
    }

    // Force waiting until all data has arrived before rendering stats
    if (!this.props.timeseriesLoaded) {
      Object.keys(values).forEach((k) => {
        values[k] = 0
      })
    }

    return values
  }

  render () {
    const values = this.getValues()

    const stats = STATS.map((s, idx) => (
      <Stat
        title={s.title}
        emoji={s.emoji}
        prefix={s.prefix}
        value={values[s.key] || 0}
        key={idx}
      />
    ))
    return (
      <div className='section'>
        <h2>Event Stats</h2>
        <Grid className='current_stats content'>{stats}</Grid>
        <Grid className='gdq-links'>
          <Col xs={12} lg={3} sm={6}>
            <a target='_blank' href='https://www.twitch.tv/gamesdonequick' rel='noreferrer'>
              Livestream
            </a>
          </Col>
          <Col xs={12} lg={3} sm={6}>
            <a target='_blank' href={VODS_URL} rel='noreferrer'>
              VODs
            </a>
          </Col>
          <Col xs={12} lg={3} sm={6}>
            <a target='_blank' href={DONATION_TRACKER_URL} rel='noreferrer'>
              Donation Tracker
            </a>
          </Col>
          <Col xs={12} lg={3} sm={6}>
            <a target='_blank' href='https://gamesdonequick.com/schedule' rel='noreferrer'>
              Schedule
            </a>
          </Col>
        </Grid>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    timeseries: state.gdq.timeseries,
    timeseriesLoaded: state.gdq.timeseriesLoaded,
    schedule: state.gdq.schedule
  }
}

export default connect(mapStateToProps)(StatsContainer)
