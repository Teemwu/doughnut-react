import { Component } from 'react'
import { View, Button, Text } from '@tarojs/components'
import { Doughnut } from '../../components/doughnut'
import './index.scss'

type PageProps = {}
type PageStates = {
  activeIndex: number,
  ratios: number[]
}
export default class Index extends Component<PageProps, PageStates> {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: 0,
      ratios: [10, 20, 30, 40]
    }
  }
  changeRatios = () => {
    const { ratios } = this.state
    this.setState({
      activeIndex: Math.round(Math.random() * 4),
      ratios: [...ratios.reverse()]
    })
  }
  render() {
    const { ratios, activeIndex } = this.state
    return (
      <View className='index'>
        <Doughnut
          value={ratios}
          active={activeIndex}
        />
        <Text>[{ratios.toString()}]</Text>
        <Button onClick={this.changeRatios}>动态改变数值</Button>
      </View>
    )
  }
}
