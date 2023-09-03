"use client";
import React, { useState } from 'react';

import {
    Box,
    Button,
    Center,
    Divider,
    Flex,
    HStack,
    Heading,
    Input,
    Select,
    SimpleGrid,
    Spacer,
    VStack,
    useSteps,
    useToast,
} from "@chakra-ui/react";
import Phone from "./phone"



const switchPhone = (phone: number) => {
    switch (phone) {
        case 0: return <Phone1 />;
        case 1: return <Phone2 />;
        case 2: return <Phone3 />;
        case 3: return <Phone4 />;
        case 4: return <Phone5 />;
        case 5: return <Phone6 />;
        case 6: return <Phone7 />;
        case 7: return <Phone8 />;
        case 8: return <Phone9 />;
        case 9: return <Phone10 />;
        case 10: return <Phone11 />;
        case 11: return <Phone12 />;
        case 12: return <Phone13 />;
        case 13: return <Phone14 />;
        case 14: return <Phone15 />;
        case 15: return <Phone16 />;
        default: return <Phone1 />;
    }
}



const Home = () => {
    const [phone, setPhone] = useState(0);
    const maxPhones = 16;

    const prevPhone = () => {
        if (phone <= 0) {
            setPhone(maxPhones - 1)
        }
        else {
            setPhone(phone - 1)
        }
    }

    const nextPhone = () => {
        if (phone >= maxPhones) {
            setPhone(0)
        }
        else {
            setPhone(phone + 1)
        }
    }


    return (
        <div className="phone-buttons">
            <div className="phone-button">
                <Button onClick={e => prevPhone()}>Prev</Button>
            </div>
            <div className="phones">
                {switchPhone(phone)}
            </div>
            <div className="phone-button">
                <Button onClick={e => nextPhone()}>Next</Button>
            </div>
        </div>
    );
}

const Phone1 = () =>
    <Phone backgroundColor={"#6648E4"}>
        <div className="crypto-image crypto-image-1">
            <Button className="enter-app-button">Enter app</Button>
        </div>
    </Phone>

const Phone2 = () =>
    <Phone>
        <div className="crypto-image crypto-image-2">
            <Button className="create-contract-button">Create Contract</Button>
        </div>
    </Phone>

const Phone3 = () =>
    <Phone>
        <div className="crypto-image crypto-image-2a">
            <Button className="select-wallet-button">Select Wallet</Button>
        </div>
    </Phone>

const Phone4 = () =>
    <Phone>
        <div className="crypto-image crypto-image-3">
            <Button className="create-crypto-button">Create Contract</Button>
        </div>
    </Phone>

const Phone5 = () =>
    <Phone>
        <div className="crypto-image crypto-image-4">
            <Button className="about-contract-button">About Contract</Button>
        </div>
    </Phone>

const Phone6 = () =>
    <Phone>
        <div className="crypto-image crypto-image-5">
            <Button className="agreement-details-button">Agreement Details</Button>
        </div>
    </Phone>

const Phone7 = () =>
    <Phone>
        <div className="crypto-image crypto-image-6">
            <Button className="payment-terms-button">Payment Terms</Button>
        </div>
    </Phone>

const Phone8 = () =>
    <Phone>
        <div className="crypto-image crypto-image-7">
            <Button className="preview-contract-button">Preview Contract</Button>
        </div>
    </Phone>

const Phone9 = () =>
    <Phone>
        <div className="crypto-image crypto-image-8">
            <Button className="contract-created-button">Payment Terms</Button>
        </div>
    </Phone>

const Phone10 = () =>
    <Phone>
        <div className="crypto-image crypto-image-9">
            <Button className="status-1-button">Next</Button>
        </div>
    </Phone>

const Phone11 = () =>
    <Phone>
        <div className="crypto-image crypto-image-10">
            <Button className="status-2-button">Next</Button>
        </div>
    </Phone>

const Phone12 = () =>
    <Phone>
        <div className="crypto-image crypto-image-11">
            <Button className="status-3-button">Next</Button>
        </div>
    </Phone>

const Phone13 = () =>
    <Phone>
        <div className="crypto-image crypto-image-12">
            <Button className="create-contract-button">Create Contract</Button>
            <Button className="last-contractor-button">Last Contractor</Button>
        </div>
    </Phone>

const Phone14 = () =>
    <Phone>
        <div className="crypto-image crypto-image-13">
            <Button className="concept-design-1-button">Next</Button>
        </div>
    </Phone>

const Phone15 = () =>
    <Phone>
        <div className="crypto-image crypto-image-14">
            <Button className="concept-design-2-button">Next</Button>
        </div>
    </Phone>

const Phone16 = () =>
    <Phone>
        <div className="crypto-image crypto-image-15">
            <Button className="concept-design-3-button">Next</Button>
        </div>
    </Phone>


export default Home;
