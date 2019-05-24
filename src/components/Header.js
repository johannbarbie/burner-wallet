import React from 'react';
import { Blockie } from "dapparatus";
import burnerloader from '../burnerloader.gif';
import { Button, Icon } from "rimble-ui";
export  default ({openScanner, network, total, ens, address, changeView, view}) => {


  let sendButtonOpacity = 1.0
  if(view==="receive" || view==="send_badge"){
    sendButtonOpacity = 0
  }



  let name = ens
  if(!name){
    name = address.substring(2,8)
  }

  let moneyDisplay
  let blockieDisplay
  if(typeof total == "undefined" || Number.isNaN(total)){
    moneyDisplay = (
      <div style={{opacity:0.1,fontSize:28,paddingTop:15}}>
        connecting...
      </div>
    )
    blockieDisplay = (
      <div>
        <img src ={burnerloader} style={{maxHeight:50,opacity:0.25,marginLeft:-20}} alt=""/>
      </div>
    )
  }else{
    /*moneyDisplay = (
      <div>
        {dollarDisplay(total)}
      </div>
    )*/
    moneyDisplay = (
      <div style={{opacity:0.4,fontSize:22,paddingTop:18}}>
        {network}
      </div>
    )
    blockieDisplay = (
      <Blockie
          address={address}
          config={{size:6}}>
      </Blockie>
    )
  }

  let scanButtonStyle = {
    opacity:sendButtonOpacity,
    position:"fixed",
    right:20,
    bottom:20,
    zIndex:2,
    cursor:"pointer"
  }

  if(view==="send_to_address"){
    scanButtonStyle.position = "absolute"
    scanButtonStyle.right = -3
    scanButtonStyle.top = 217
    delete scanButtonStyle.bottom
  }

  let bottomRight = (
    <div style={scanButtonStyle}  >
    <Button
      onClick={() => {
        openScanner({view:"send_to_address"})
      }}
      style={{backgroundColor: "white", border: "3px solid black"}}
      color="black"
      borderRadius={"50%"}
      height={"auto"}
      width={"auto"}
      p={0} m={0}
      position={"absolute"}
      bottom={3}
      right={3}
    >
      <Icon name="CenterFocusWeak" size={90} p={3} />
    </Button>
    </div>
  )

  let opacity = 0.5



  let topLeft

  if(view==="main" || view==="exchange"){
    opacity = 1.0
    topLeft = (
      <div style={{position:"absolute",left:16,top:4,zIndex:1,cursor:"pointer"}} onClick={() => changeView('receive')} >
          {blockieDisplay} <div style={{position:"absolute",left:60,top:15,fontSize:14}}>{name}</div>
      </div>
    )
  }else{
    topLeft = (
      <div style={{position:"absolute",left:16,top:4,zIndex:1,cursor:"pointer"}} onClick={() => changeView('main')} >
          {blockieDisplay} <div style={{position:"absolute",left:60,top:15,fontSize:14}}>{name}</div>
      </div>
    )
  }

  let topRight = (
    <div style={{position:"absolute",right:28,top:-4,zIndex:1,fontSize:46,opacity:0.9}}  >
      {moneyDisplay}
    </div>
  )


  return (
    <div className="header" style={{opacity, "z-index": "99"}}>
      {topLeft}
      {topRight}
      {view === "main" ?  bottomRight : null}
    </div>
  )
};
