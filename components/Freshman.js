import React from 'react';
import { View, Text, StyleSheet, Button, Image, PermissionsAndroid, AsyncStorage } from 'react-native';
import { Alert } from 'react-native';
import DeviceNumber from 'react-native-device-number';
import Dialog from "react-native-dialog";

//firebase
import { firebase } from '@react-native-firebase/database';


class Freshman extends React.Component{
    constructor(props){                      
        super(props)
        this.state = {
            phoneNumber: "",
            pin: "",
            checkNumberDialogVisibility: false,
            pinDialogVisibility: false,
            automatic: false,
            hasVCard: false
        }
    }

    async getPhoneNumber(){
        
        
        const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
            // Permission was denied...
            Alert.alert("sem permissao")
        }
    
          DeviceNumber.get().then((phoneNumber) => this.setState({phoneNumber: phoneNumber}))
    }

    async checkPhoneNumber(){
        await this.hasVCard(this.state.phoneNumber)
        if(this.state.phoneNumber === "" || this.state.hasVCard === false){
            this.setState({checkNumberDialogVisibility: true})
        }
        else{
            console.log(this.state.phoneNumber.mobileNumber)
            this.setState({pinDialogVisibility: true, automatic: true})
        }
    }

    async hasVCard(phoneNumber){
        try {
            const snapshot = await firebase
                .app()
                .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
                .ref('/vcards/' + phoneNumber)
                .once('value')

            if(snapshot.exists()){
                this.setState({hasVCard: true})
            }else{
                this.setState({hasVCard: false})
            }

        } catch (error) {
            console.log("Has vCard " + phoneNumber + ": " + error)
        }

    }
    



    handlePhoneNumber = (phoneNumber) => { 
        this.setState({phoneNumber: phoneNumber})
    }
    handlePIN = (pin) => { 
        this.setState({pin: pin})
    }
    
    cancelPhoneNumber(){
        this.setState({phoneNumber: ""})
        this.setState({checkNumberDialogVisibility: false})
    }
    cancelPIN(){
        this.setState({pin: ""})
        this.setState({pinDialogVisibility: false})
    }

    addPhoneNumber(){
        //console.log(this.state.phoneNumber.charAt(0))
        //console.log(this.state.phoneNumber.length)
        if(this.state.phoneNumber.charAt(0) !== '9' || this.state.phoneNumber.length != 9){
            Alert.alert('Número inválido. Tente novamente!')
        } /*else if(this.hasVCard(this.state.phoneNumber)) {
            Alert.alert("Phone number already has a Vcard")
            this.setState({checkNumberDialogVisibility: false})
        }*/
        else{
            this.setState({checkNumberDialogVisibility: false})
            this.setState({pinDialogVisibility: true})
        }
    }
    addPIN(){
        if(this.state.pin.length < 4){
            Alert.alert('Invalid Confirmation code!')
        } else{
            if(this.state.automatic){
                this.setState({pinDialogVisibility: false})
                this._storeData(this.state.phoneNumber.mobileNumber.slice(4));
                this.createUser(this.state.phoneNumber.mobileNumber.slice(4),this.state.pin);
                this.props.navigation.navigate('Homepage',{ myPhoneNumber: this.state.phoneNumber.mobileNumber.slice(4), pin: this.state.pin, isDeleted: false})

            } else{
                this.setState({pinDialogVisibility: false})
                this._storeData(this.state.phoneNumber);
                this.createUser(this.state.phoneNumber,this.state.pin)
                this.props.navigation.navigate('Homepage',{ myPhoneNumber: this.state.phoneNumber, pin: this.state.pin, isDeleted: false})
            }
        }
    }


    componentDidMount(){
        this._retrieveData()
    }

    _storeData = async (value) => {
        try {
            await AsyncStorage.setItem(
                'phoneNumber',
                value
            );
        } catch (error) {
            // Error saving data
        }
    };

    _retrieveData = async () => {
        try {
            const value = await AsyncStorage.getItem('phoneNumber');
            if (value !== null) {
                // We have data!!
                
                this.props.navigation.navigate('Homepage',{ myPhoneNumber: value})
            } else{ 
                // we dont have data
                this.getPhoneNumber()
            }
        } catch (error) {
            // Error retrieving data
            console.log(error)
        }
    };


    // firebase

    // create user and send it to db
    createUser = (phoneNumber,pin) =>{
        const database = firebase
        .app()
        .database('https://vcard-e2c3d-default-rtdb.europe-west1.firebasedatabase.app/')
        .ref('/vcards/' + phoneNumber)
        .set({
          phone_number: ''+phoneNumber+'',
          balance: '1000',
          piggybank: '100',
          pin: ''+pin+'',
          transactions: [],
        })
        .then(() => Alert.alert('VCard ' + phoneNumber + ' created'));
    }


    render(){
        return (
            <View style={{flex: 1, backgroundColor: '#9FE3DA'}}>
                <View style={styles.container}>
                    <Dialog.Container visible={this.state.pinDialogVisibility}>
                        <Dialog.Title>Create a confirmation code</Dialog.Title>
                        <Dialog.Input label="Insert a code with more than 4 digits." 
                        onChangeText={(confirmationCode) => this.handlePIN(confirmationCode)}
                        secureTextEntry={true}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={this.cancelPIN.bind(this)} />
                        <Dialog.Button label="Ok" onPress={this.addPIN.bind(this)} />
                    </Dialog.Container>
                    <Dialog.Container visible={this.state.checkNumberDialogVisibility}>
                        <Dialog.Title>Add phone number</Dialog.Title>
                        <Dialog.Input label="Phone number" onChangeText={(phoneNumber) => this.handlePhoneNumber(phoneNumber)}></Dialog.Input>
                        <Dialog.Button label="Cancel" onPress={this.cancelPhoneNumber.bind(this)} />
                        <Dialog.Button label="Add" onPress={this.addPhoneNumber.bind(this)} />
                    </Dialog.Container>
                </View>
                <View style={{display: 'flex', flexDirection: 'column', flex: 1, justifyContent: "space-between"}}>
                    <Image style={styles.welcome} source={require('../images/welcome.png')} />
                    <Image style={styles.logo} source = {require('../vcard-logo.png')} />
                    <Text style={styles.smalltitle}>Are you a new user?</Text>
                    <View style={styles.viewButton}>
                        <Button style={styles.buttonCard}
                                title="Create New Card"
                                color="#333333"
                                onPress={() => this.checkPhoneNumber()}
                        />
                    </View>
                </View>
            </View>
        );
    }


}

const styles = StyleSheet.create({
    welcome: {
        marginTop: "5%",
        position: 'relative',
        flex: 4,
        height: "40%",
        width: "60%",
        alignSelf: "center",
        alignItems: 'center',
        justifyContent: "center",
    },
    logo: {
        marginTop: "0%",
        position: 'relative',
        flex: 9,
        height: "100%",
        width: "100%",
        alignSelf: "center",
        alignItems: 'center',
        justifyContent: "center",
    },
    smalltitle: {
        marginTop: "-8%",
        position: 'relative',
        right: -50,
        flex: 4,
        width: 300,
        fontSize: 18,
    },
    viewButton: {
        marginTop: "-20%",
        position: 'relative',
        flex: 8,
        width: "89%",
        alignSelf: "center",
    },
    buttonCard:{
        position: 'relative',
        backgroundColor: '#333333',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
        textAlign: 'center',
        color: '#FFFFFF',
        fontSize: 18,
        textAlignVertical: 'center',
        alignItems: 'center',
        alignSelf: "center",
        justifyContent: "center",
    },
});

export default Freshman;