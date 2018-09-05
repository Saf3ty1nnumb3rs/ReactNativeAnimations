import React, { Component } from 'react';
import { 
    View,
    Animated,
    PanResponder,
    Dimensions,
    StyleSheet,
    LayoutAnimation,
    UIManager
 } from 'react-native';
//Dimensions can coolect size properties of the current window
//contributes to similar behavior on all devices
const SCREEN_WIDTH = Dimensions.get('window').width;
 // threshold is the minimum distance to return condition
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
//defailt props set the component to be able to pass through the prop call if props weren't passed to the component
    static defaultProps = {
        onSwipeRight: () => {},
        onSwipeLeft: () => {},
    }

    constructor(props) {
        super(props);
        //XY value not added because assumption of card position isn't necessary
        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            // on press
            onStartShouldSetPanResponder: () => true,
            // when moving - event and gesture
            onPanResponderMove: (event, gesture) => {
                //tracks movement and brings object with it
                position.setValue( {x: gesture.dx, y: gesture.dy })
            },
            // on press release
            onPanResponderRelease: (event, gesture) => {
                if(gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right')
                }else if(gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left')
                } else {
                this.resetPosition();
                }
            }
        });

        // this.panResponder = panResponder ---- completely valid as well
        // also this.position = position
        this.state = { panResponder, position, index: 0 };
    }
    componentWillReceiveProps(nextProps) {
        if(nextProps.data !== this.props.data) {
            this.setState( { index: 0 } )
        }
    }
    componentWillUpdate() {
        //Mainly for Android --> LayoutAnimation.spring() bounces next object to change
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }
    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: { x, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue( { x: 0, y: 0 } );
        this.setState( { index: this.state.index + 1 } );
    }

    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: { x: 0, y: 0 }
        }).start();
    }

    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH *1.5, 0, SCREEN_WIDTH*1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        }
    }

    renderCards() {
        if(this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, i) => {
            if(i < this.state.index) { return null }
            if(i === this.state.index) {
               return (
                   <Animated.View
                   key={item.id}
                   style={[this.getCardStyle(), styles.cardStyle]}
                    {...this.state.panResponder.panHandlers}
                    >
                    {this.props.renderCard(item)};
                   </Animated.View> 
               );
           }
           return (
               <Animated.View 
               key={item.id} 
               style={[styles.cardStyle, { top: 10 * (i - this.state.index), right: 1 * (i- this.state.index) }]}
               >
               {this.props.renderCard(item)}
               </Animated.View>
            )
        }).reverse();
    }
    render() {
        return (
            <View> 
                {this.renderCards()}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
})

export default Deck;