import React from 'react';
import { withTranslation } from 'react-i18next'
import { Icon } from 'rimble-ui'
import { ActionButton } from '../components/Buttons'

class Receive extends React.Component {
  render() {
    let {icon,text,action, t} = this.props

    if(!icon) icon = "times"
    if(!text) text = t('done')

    //icon = "fas fa-"+icon

    return (
      <div name="theVeryBottom" className="text-center bottom-text" style={{marginBottom:20}}>
        <ActionButton onClick={()=>{action()}}>
            <Icon name={icon} mr={2} />
            {text}
        </ActionButton>
      </div>
    )
  }
}
export default withTranslation()(Receive)