import { whileStatement } from '@babel/types';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    Image,
    Alert,
    PermissionsAndroid,
    FlatList,
    TextInput,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    ScrollView
} from 'react-native';
import SelectDropdown from 'react-native-select-dropdown'
//import FontAwesome from "react-native-vector-icons/FontAwesome";
import {faCoffee} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import { solid, regular, brands } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used




// import {  NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator, HeaderBackButton } from '@react-navigation/native-stack';

//firebase
import { firebase } from '@react-native-firebase/database';



export default class Transactionspage extends React.Component{
    constructor(props){
        super(props)
        const { navigation, route } = props
        const params = route.params
        var transactions = params.transactions==undefined ? false : params.transactions
        var arrayTransactions = []

        for(var i in transactions){
            arrayTransactions.push(transactions[i])
        }

        this.state = {
             transactions: arrayTransactions,
             backupTransactions: arrayTransactions,
             typeTransaction: "0"
        }

    }

    componentDidMount(){
        console.log(this.state.transactions)
    }
    //   headerLeft:(<HeaderBackButton onPress={()=>{
    //    navigation.navigate('Contactspage',{balance: this.state.balance, piggybank: this.state.piggybank})}}/>)

    typeTransaction = ["All","Credit", "Debit"];

    render(){
        return(
            <View  style={{flex:1, backgroundColor: '#9FE3DA', justifyContent: "space-evenly", flexDirection: "column"}}>
                <View style={styles.dropdownsRow}>
                    <SelectDropdown
                        data={this.typeTransaction}
                        onSelect={(selectedItem, index) => {
                            console.log(selectedItem, index)
                            //this.setState({typeTransaction: index})
                            var arrayFilter = []
                            var selectedIndex = ""
                            switch(index){
                                case 0: selectedIndex = "All"
                                          break
                                case 1: selectedIndex = "Credit"
                                          break
                                case 2: selectedIndex = "Debit"
                                          break
                            }
                            
                            console.log("selectedIndex: " + selectedIndex)
                            if(selectedIndex === "All"){
                                this.setState({transactions: this.state.backupTransactions})
                            } else{
                                for(var i in this.state.backupTransactions){
                                    console.log("filtrar: " + this.state.backupTransactions[i].type)
                                    if(this.state.backupTransactions[i].type === selectedIndex){
                                        console.log("puxou: " + this.state.backupTransactions[i].type)
                                        arrayFilter.push(this.state.backupTransactions[i])
                                    }
                                }
                                this.setState({transactions: arrayFilter})
                            }


                            

                        }}
                        defaultButtonText={this.typeTransaction[0]}
                        //defaultButtonText={"Search by type..."}
                        buttonTextAfterSelection={(selectedItem, index) => {
                            // text represented after item is selected
                            // if data array is an array of objects then return selectedItem.property to render after item is selected
                            return selectedItem
                        }}
                        rowTextForSelection={(item, index) => {
                            // text represented for each item in dropdown
                            // if data array is an array of objects then return item.property to represent item in dropdown
                            return item
                        }}
                        buttonStyle={styles.dropdown1BtnStyle}
                        buttonTextStyle={styles.dropdown1BtnTxtStyle}
                        dropdownIconPosition={"right"}
                        dropdownStyle={styles.dropdown1DropdownStyle}
                        rowStyle={styles.dropdown1RowStyle}
                        rowTextStyle={styles.dropdown1RowTxtStyle}
                    />
                </View>
                    <View style={{/*position: 'absolute', right: 25, top: 50*/ flex: 75, backgroundColor: '#9FE3DA'}}>
                        <FlatList
                            data={this.state.transactions}
                            renderItem={({item}) =>                           
                                <View style={styles.containerTransactions}>
                                    <Text style={styles.contactName}>Value:{item.amount}    Type:{item.type}    VCard:{item.phoneNumber}</Text>
                                    <Text style={styles.contactName}>Avaiable Balance:{item.currentBalance}    Balance before transaction:{item.oldBalance}</Text>
                                </View> }
                        />
                    </View>
            </View>
        )
    }


}

const styles = StyleSheet.create({
    dropdownsRow: {
        marginTop: "2%",
        flexDirection: "row",
        width: "55%",
        paddingHorizontal: "5%",
    },
    dropdown1BtnStyle: {
        flex: 1,
        height: 33,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#444",
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#708090',
    },
    dropdown1BtnTxtStyle: {
        color: 'white',
        textAlign: "center",
        fontSize: 16,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
    },
    dropdown1DropdownStyle: {
        backgroundColor: "#EFEFEF"
    },
    dropdown1RowStyle: {
        backgroundColor: "#EFEFEF",
        borderBottomColor: "#C5C5C5",
    },
    dropdown1RowTxtStyle: {
        color: "#444",
        textAlign: "left"
    },
    containerTransactions: {
        backgroundColor: '#FFFFFF',
        height: 80,
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },



})


