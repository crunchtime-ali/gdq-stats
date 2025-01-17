import React from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'
import {
  setCurrentSeries,
  setButtonZoom,
  setGameZoom,
  setCurrentSecondarySeries
} from '../actions'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import Grid from 'react-bootstrap/lib/Grid'
import Col from 'react-bootstrap/lib/Col'
import Row from 'react-bootstrap/lib/Row'
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup'
import Button from 'react-bootstrap/lib/Button'
import PacmanLoader from 'halogen/PacmanLoader'
import dayjs from 'dayjs'
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
import VerticalLabel from './VerticalLabel'
import GamesTooltip from './GamesTooltip'
import GRAPHS from '../graph-definitions'
import Select from 'react-select'
import { movingAverage, gameForId } from '../utils'
import {
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  DARK_FILL_COLOR,
  LIGHT_FILL_COLOR
} from '../constants'
import percentile from 'percentile'

const zoomButtons = [
  { label: '1h', hours: 1 },
  { label: '3h', hours: 3 },
  { label: '6h', hours: 6 },
  { label: '12h', hours: 12 },
  { label: '1d', hours: 24 },
  { label: '3d', hours: 72 }
]

class GraphContainer extends React.Component {
  static propTypes = {
    setCurrentSeries: PropTypes.func.isRequired,
    activeSeries: PropTypes.number.isRequired,
    timeseries: PropTypes.array.isRequired,
    schedule: PropTypes.array.isRequired,
    activeButtonZoomIndex: PropTypes.number,
    activeGameZoom: PropTypes.number,
    setGameZoom: PropTypes.func.isRequired,
    setButtonZoom: PropTypes.func.isRequired,
    fullscreen: PropTypes.bool,
    setCurrentSecondarySeries: PropTypes.func,
    activeSeriesSecondary: PropTypes.number
  }

  constructor (props) {
    super(props)
    this.onSelect = this.onSelect.bind(this)
    this.onSelectSecondary = this.onSelectSecondary.bind(this)
  }

  onSelect (idx) {
    this.props.setCurrentSeries(idx)
  }

  onSelectSecondary (idx) {
    this.props.setCurrentSecondarySeries(idx)
  }

  // Creates "synthetic" series by aggregating a base series
  //  Aggregations are either accumulations or 'derivations'
  //  Accumulate transforms "per minute" series to cumulative
  //  Derive transforms cumulative series to "per minute"
  createSyntheticSeries (key, series) {
    const baseKey = key.slice(0, key.indexOf('_'))
    const accumulate = (acc, val) => {
      const newVal = val[baseKey] + (acc.length ? acc[acc.length - 1][key] : 0)
      val[key] = newVal
      acc.push({ ...val })
      return acc
    }
    const derive = (acc, val, idx) => {
      // Get most recent value
      let mostRecentVal = 0
      let mostRecentIdx = -1
      for (let i = acc.length - 1; i >= 0; i--) {
        if (acc[i][baseKey]) {
          mostRecentVal = acc[i][baseKey]
          mostRecentIdx = i
          break
        }
      }

      // Estimate derived slope over window (if missing data)
      const newVal =
        (val[baseKey] - mostRecentVal) / (acc.length - mostRecentIdx)
      // Backfill data points that are missing data
      for (let i = mostRecentIdx + 1; i < acc.length; i++) {
        acc[i][key] = newVal
      }
      // Set the value of the new datapoint and append it
      val[key] = newVal
      acc.push({ ...val })
      return acc
    }
    const reduceFunc =
      key.slice(baseKey.length + 1) === 'acc' ? accumulate : derive
    return series.reduce(reduceFunc, []).slice(1)
  }

  // Returns [min, max] startTime times of domain based on current state of graph options
  getDomain () {
    const { activeButtonZoomIndex, activeGameZoom } = this.props
    const activeGame = gameForId(activeGameZoom, this.props.schedule)
    const maxTime = this.props.timeseries[this.props.timeseries.length - 1]
      .time
    const minTime = this.props.timeseries[0].time
    let min = dayjs(minTime).clone()
    let max = dayjs(maxTime).clone()
    if (activeButtonZoomIndex >= 0) {
      const zoomHours = zoomButtons[activeButtonZoomIndex].hours
      min = dayjs(maxTime).subtract(zoomHours, 'hours')
    } else if (activeGame) {
      const [hours, minutes, seconds] = activeGame.duration.split(':')
      min = activeGame.startTime
      max = activeGame.startTime
        .clone()
        .add(hours, 'hours')
        .add(minutes, 'minutes')
        .add(seconds, 'seconds')
    }
    return [min, max]
  }

  getDateFormatter (domain) {
    const [min, max] = domain
    const format = min
      .clone()
      .add(1, 'days')
      .isBefore(max)
      ? 'ddd, hA'
      : 'h:mm A'
    return d => dayjs(d * 1000).format(format)
  }

  getGraphSeries ({ activeGraph, isPrimary }) {
    const axisId = isPrimary ? 0 : 1
    const yAxisLabel = (
      <VerticalLabel
        axisType='yAxis'
        fill={DARK_FILL_COLOR}
        fontWeight={300}
        fontSize={13}
        xOffset={isPrimary ? 75 : -5}
      >
        {activeGraph.name}
      </VerticalLabel>
    )
    // Force a 0-based chart when no zoom is active
    const minDomain =
      this.props.activeGameZoom !== null ||
      this.props.activeButtonZoomIndex !== null
        ? 'dataMin'
        : 0
    return [
      <Line
        type='basis'
        dataKey={activeGraph.key}
        name={activeGraph.name}
        stroke={isPrimary ? PRIMARY_COLOR : SECONDARY_COLOR}
        strokeWidth={1.5}
        dot={false}
        activeDot
        yAxisId={axisId}
        key={0 + (isPrimary ? 0 : 2)}
      />,
      <YAxis
        dataKey={activeGraph.key}
        tickFormatter={activeGraph.format}
        axisLine={{ stroke: LIGHT_FILL_COLOR }}
        tickLine={{ stroke: LIGHT_FILL_COLOR }}
        tick={{ fill: DARK_FILL_COLOR, fontWeight: 300, fontSize: 13 }}
        domain={[minDomain, 'dataMax']}
        interval='preserveStartEnd'
        minTickGap={0}
        label={yAxisLabel}
        orientation={isPrimary ? 'left' : 'right'}
        yAxisId={axisId}
        key={1 + (isPrimary ? 0 : 2)}
      />
    ]
  }

  getGraph () {
    if (!this.props.timeseries || !this.props.timeseries.length) {
      return null
    }

    const domain = this.getDomain()

    const activeGraph = GRAPHS[this.props.activeSeries]
    const secondaryActiveGraph = GRAPHS[this.props.activeSeriesSecondary]

    const dateFormat = this.getDateFormatter(domain)

    let series = this.props.timeseries
    if (activeGraph.key.indexOf('_') !== -1) {
      series = this.createSyntheticSeries(activeGraph.key, series)
    }
    if (secondaryActiveGraph.key.indexOf('_') !== -1) {
      series = this.createSyntheticSeries(secondaryActiveGraph.key, series)
    }

    const trimmedTimeseries = series
      // Filter to correct domain
      .filter(obj => {
        const objStartTime = dayjs(obj.time)
        return (
          objStartTime.isAfter(domain[0]) && objStartTime.isBefore(domain[1])
        )
      })

    const rate = Math.ceil(trimmedTimeseries.length / 500)
    let resampleSeries = trimmedTimeseries
      // Resample
      .filter(
        (d, idx) =>
          idx % rate === 0 &&
          Number.isFinite(d[activeGraph.key]) &&
          d[activeGraph.key] >= 0 &&
          (!secondaryActiveGraph.key ||
            (Number.isFinite(d[secondaryActiveGraph.key]) &&
              d[secondaryActiveGraph.key] >= 0))
      )
      .map(o => {
        return { ...o, time: dayjs(o.time).unix() }
      })

    // Trim based on percentile
    if (activeGraph.percentile) {
      const threshold = percentile(
        activeGraph.percentile,
        trimmedTimeseries,
        obj => obj[activeGraph.key]
      )[activeGraph.key]
      resampleSeries = resampleSeries.filter(
        obj => obj[activeGraph.key] < threshold
      )
    }
    if (secondaryActiveGraph.percentile) {
      const threshold = percentile(
        secondaryActiveGraph.percentile,
        trimmedTimeseries,
        obj => obj[secondaryActiveGraph.key]
      )[secondaryActiveGraph.key]
      resampleSeries = resampleSeries.filter(
        obj => obj[secondaryActiveGraph.key] < threshold
      )
    }

    // Perform moving average smoothing
    if (activeGraph.movingAverage) {
      const movingAverageScale = activeGraph.movingAverageScale || 1
      resampleSeries = movingAverage(
        resampleSeries,
        activeGraph.key,
        movingAverageScale * Math.ceil(trimmedTimeseries.length / 250)
      )
    }
    if (secondaryActiveGraph.movingAverage) {
      const movingAverageScale = activeGraph.movingAverageScale || 1
      resampleSeries = movingAverage(
        resampleSeries,
        secondaryActiveGraph.key,
        movingAverageScale * Math.ceil(trimmedTimeseries.length / 250)
      )
    }

    const tooltipFormat = activeGraph.tooltipFormat || activeGraph.format
    const tooltipFormatSecondary =
      secondaryActiveGraph.tooltipFormat || secondaryActiveGraph.format

    const selectOptions = this.props.schedule.filter(obj =>
      obj.startTime.isBefore(dayjs())
    )
    const activeGame = this.props.activeGameZoom
      ? gameForId(this.props.activeGameZoom, this.props.schedule)
      : null

    // const advancedButton = <small>
    //   <b style={{ paddingLeft: 16, verticalAlign: 'middle' }}>
    //     <a href='graph'>(Advanced)</a>
    //   </b>
    // </small>

    const advancedButton = (
      <Button className='advanced-button' size='sm' href='graph'>
        Advanced
      </Button>
    )

    return (
      <Grid className='graph-container-fullscreen'>
        <Row>
          <Col sm={4} md={2} className='graph-series-chooser'>
            <Nav
              bsStyle='pills'
              stacked
              activeKey={this.props.activeSeries}
              onSelect={this.onSelect}
            >
              {GRAPHS.map((obj, idx) => {
                if (obj.name !== "Tweets" && obj.name !== "Tweets per minute") {
                  return(
                <NavItem eventKey={idx} key={idx}>
                  {obj.name}
                </NavItem>)
                }})}
            </Nav>
          </Col>
          <hr
            className='hidden-sm hidden-md hidden-lg'
            style={{ borderTopWidth: 1.5, borderColor: LIGHT_FILL_COLOR }}
          />
          <Col
            sm={8}
            md={this.props.fullscreen ? 8 : 10}
            className='graph-container'
          >
            <ResponsiveContainer width='100%' height={500}>
              <LineChart data={resampleSeries} margin={{ top: 20 }}>
                {this.getGraphSeries({ activeGraph, isPrimary: true })}
                {this.props.fullscreen
                  ? this.getGraphSeries({
                    activeGraph: secondaryActiveGraph,
                    isPrimary: false
                  })
                  : null}
                <Tooltip
                  content={
                    <GamesTooltip
                      schedule={this.props.schedule}
                      format={tooltipFormat}
                      secondaryFormat={tooltipFormatSecondary}
                    />
                  }
                  animationDuration={250}
                />
                <XAxis
                  dataKey='time'
                  type='number'
                  scale='time'
                  axisLine={{ stroke: LIGHT_FILL_COLOR }}
                  tickLine={{ stroke: LIGHT_FILL_COLOR }}
                  tickFormatter={dateFormat}
                  tick={{
                    fill: DARK_FILL_COLOR,
                    fontWeight: 300,
                    fontSize: 13
                  }}
                  interval='preserveStart'
                  domain={['dataMin', 'dataMax']}
                  minTickGap={50}
                />
              </LineChart>
            </ResponsiveContainer>
          </Col>
          {this.props.fullscreen
            ? (
              <Col sm={4} md={2} className='graph-series-secondary-chooser'>
                <Nav
                  bsStyle='pills'
                  stacked
                  activeKey={this.props.activeSeriesSecondary}
                  onSelect={this.onSelectSecondary}
                >
                  {GRAPHS.map((obj, idx) => (
                    <NavItem eventKey={idx} key={idx}>
                      {obj.name}
                    </NavItem>
                    )
                  )}}
                </Nav>
              </Col>
              )
            : null}
        </Row>
        <Row className='series-options'>
          <Col sm={4} style={{ height: 32 }}>
            <span
              style={{
                position: this.props.fullscreen ? 'relative' : null,
                top: this.props.fullscreen ? 8 : 0
              }}
            >
              Options {this.props.fullscreen ? null : advancedButton}
            </span>
          </Col>
          <Col sm={3} style={{ fontFamily: 'Open Sans' }}>
            <Select
              options={selectOptions}
              labelKey='name'
              valueKey='name'
              placeholder='Zoom to Game...'
              value={this.props.activeGameZoom ? activeGame.name : null}
              onChange={obj => this.props.setGameZoom(obj ? obj.id : null)}
            />
          </Col>
          <Col sm={5}>
            <ButtonGroup style={{ fontFamily: 'Open Sans' }}>
              {zoomButtons.map((obj, idx) => (
                <Button
                  key={idx}
                  active={this.props.activeButtonZoomIndex === idx}
                  onClick={() => this.props.setButtonZoom(idx)}
                >
                  {obj.label}
                </Button>
              ))}
            </ButtonGroup>
          </Col>
        </Row>
      </Grid>
    )
  }

  render () {
    const graph = this.getGraph()
    return (
      <div className='section'>
        <h2>Live Stats</h2>
        {graph || <PacmanLoader color={PRIMARY_COLOR} className='gdq-loader' />}
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    activeSeries: state.gdq.series,
    activeSeriesSecondary: state.gdq.seriesSecondary,
    timeseries: state.gdq.timeseries,
    schedule: state.gdq.schedule,
    activeButtonZoomIndex: state.gdq.activeButtonZoomIndex,
    activeGameZoom: state.gdq.activeGameZoom
  }
}

export default connect(
  mapStateToProps,
  {
    setCurrentSeries,
    setButtonZoom,
    setGameZoom,
    setCurrentSecondarySeries
  }
)(GraphContainer)
