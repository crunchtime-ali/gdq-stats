import React from 'react'
import Glyphicon from 'react-bootstrap/lib/Glyphicon'
import { PropTypes } from 'prop-types'

const IconLink = ({ icon, onClick, active }) => {
  const color = active ? '#333' : '#ddd'
  return (
    <a style={{cursor: 'pointer'}} onClick={onClick}><Glyphicon style={{color: color}} glyph={icon} /></a>
  )
}

IconLink.propTypes = {
  icon: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  active: PropTypes.bool
}

export default IconLink