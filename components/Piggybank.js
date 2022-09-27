import { whileStatement } from '@babel/types';
import React from 'react';
import { View, Text, StyleSheet, Button, Image, Alert, PermissionsAndroid, FlatList, TextInput, SafeAreaView, TouchableOpacity } from 'react-native';

import {  NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, HeaderBackButton } from '@react-navigation/native-stack';

//firebase
import { firebase } from '@react-native-firebase/database';



export default class Piggybank extends React.Component{
    constructor(props){
        super(props)
        const { navigation, route } = props
        const params = route.params

        /*props.navigation.setOptions({ headerLeft: () => (
            <Button
                // color="#d3d3d3"
              onPress={() => props.navigation.navigate('Homepage',{balance: this.state.balance, piggybank: this.state.piggybank, refresh: 1})}
              title="<-"
            /> )})*/
        this.state = {
            phoneNumber: params.myPhoneNumber,
            amount: "",
            balance: params.balance,
            piggybank: params.piggybank,
        }

    }

 //   headerLeft:(<HeaderBackButton onPress={()=>{
    //    navigation.navigate('Contactspage',{balance: this.state.balance, piggybank: this.state.piggybank})}}/>)


    readValues(phoneNumber){

        const getBalance = firebase
        .app()
        .database('Insert firebase url')
        .ref('/vcards/' + phoneNumber)
        .once('value')
        .then(snapshot => this.setState({balance: snapshot.toJSON().balance, piggybank: snapshot.toJSON().piggybank}))
        
    }


    updatePiggyBank(phoneNumber,amount,isAdding){
        let validChars = ".0123456789"
        let validString = true

        for(let b=0; b<amount.length;b++){
            if(!validChars.includes(amount[b])){
                    validString = false
                    break
            }
        }
        
        if(validString && amount!== "0"){
            if(isAdding){
                if(parseFloat(this.state.balance) >= (parseFloat(this.state.piggybank) + parseFloat(amount))){
                    var newPiggybank = parseFloat(this.state.piggybank) + parseFloat(amount) // isto acho q sao strings
                    const addPiggy = firebase
                    .app()
                    .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
                    .ref('/vcards/' + phoneNumber)
                    .update({
                        piggybank: ""+newPiggybank+""
                    })
                    .then(() => this.readValues(phoneNumber));
                }else{
                    Alert.alert("Not enough money to do this operation.")
                }
            } else {
                if (parseFloat(this.state.piggybank) - parseFloat(amount) >= 0) {
                    var newPiggybank = parseFloat(this.state.piggybank) - parseFloat(amount) // acho q isto sao strings
                    const addPiggy = firebase
                        .app()
                        .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
                        .ref('/vcards/' + phoneNumber)
                        .update({
                            piggybank: "" + newPiggybank + ""
                        })
                        .then(() => this.readValues(phoneNumber));
                } else {
                    Alert.alert("Operation not valid")
                }
            }

        } else{
            Alert.alert("Invalid amount.")
        }

    }



    handlePiggybankInput = (input) => { this.setState({amount: input})}




    render(){
        return(
            <View style={{display: 'flex', flexDirection: 'column', flex: 1, justifyContent: "space-between",backgroundColor: '#9FE3DA'}}>
                <View style={styles.imgView}>
                    <Image style={styles.imgStyle} source={require('../images/piggy.png')}></Image>
                    <Text style={styles.textValue}>{this.state.piggybank}€</Text>
                </View>
                <View style={styles.menuContiner}>
                    <TextInput
                        style={styles.amountText}
                        placeholder="Insert the Amount ..."
                        keyboardType="numeric"
                        placeholderTextColor='#dddddd'
                        onChangeText={(input) => this.handlePiggybankInput(input)}
                        > 
                    </TextInput>
                    <View style={styles.btnAdd}>
                        {/*<Text style={styles.btnText}>Add</Text>*/}
                        <Button color="#333333" title={'Add'}
                        onPress={() => this.updatePiggyBank(this.state.phoneNumber,this.state.amount,true)}/>
                    </View>
                    <View style={styles.btnRemove}>
                        {/*<Text style={styles.btnText}>Remove</Text>*/}
                        <Button color="#333333" title={'Remove'} 
                        onPress={() => this.updatePiggyBank(this.state.phoneNumber,this.state.amount,false)}/>
                    </View>
                </View>
            </View>
        )
    }

  
}

const styles = StyleSheet.create({
    imgView:{
        flex: 16,
        position: 'relative',
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
    },

    imgStyle:{
        width: 450,
        height: 450,
        resizeMode: 'contain',
    },

    textValue:{
        position: 'absolute',
        color: 'black',
        top: '54%',
        //marginRight: "7%",
        //left: "47%",
        fontSize: 25,
        fontWeight: "bold",
    },
    
    menuContiner:{
        position: 'relative',
        width: '75%',
        height: '45%',
        alignItems: 'center',
        //justifyContent: 'space-evenly',
        alignSelf: "center",
        display: 'flex',
        flexDirection: 'column',
        flex: 9,
    },

    amountText:{
        alignItems: 'center',
        backgroundColor: 'white',
        color: 'black',
        height: 50,
        width: '95%',
        fontSize: 18,
        padding: 10,
        marginBottom: 17,
        borderRadius: 25,
        fontWeight: '400',
    },

    btnAdd:{
        width: '95%',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginTop: '5%',
        backgroundColor: '#333333',
        marginBottom: '2.5%',
    },

    btnRemove:{
        width: '95%',
        borderRadius: 25,
        paddingVertical: 8,
        backgroundColor: '#333333',
        paddingHorizontal: 10,
    },

    btnText:{
        color: 'white',
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: 16,
        textAlign: 'center',
    },

    buttonCard:{
        position: 'relative',
        backgroundColor: '#333333',
        width: 410,
        height: 34,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 18,
        textAlignVertical: 'center',
        alignSelf: "center",
    },
})

