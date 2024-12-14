import { View, Text } from 'react-native'
import React,{useState} from 'react'
import  LottieView  from 'lottie-react-native';
import Splashone from '../assets/animations/splashOne.json'
import Splashtwo from '../assets/animations/splashTwo.json'
import Animated,{ FadeInRight, FadeOut, FadeInLeft  } from 'react-native-reanimated';


const AnimatedSplashScreen = ({
  onAnimationFinish = () => {},
}: {
  onAnimationFinish?: (isCancelled: boolean) => void;
}) => {
    const [loading, setLoading] = useState(true);
    const [loading1, setLoading1] = useState(false);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
     <Animated.View
      entering={FadeInRight.duration(2000)}
     exiting={FadeOut.duration(2000)}
     >
<LottieView 
        source={Splashone}
        autoPlay
        loop ={false}
        duration={4000}
        style={{width: 200, height: 200}}
        onAnimationFinish={() => {
          onAnimationFinish(false);
        }}
        />
        </Animated.View>

    </View>
  )
}

export default AnimatedSplashScreen