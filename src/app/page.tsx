"use client";
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

const Home = () => (
    <div className="phones">
        <Phone backgroundColor={"#6648E4"}>
            <div className="crypto-image crypto-image-1">
                <Button className="enter-app-button">Enter app</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-2">
                <Button className="create-contract-button">Create Contract</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-2a">
                <Button className="select-wallet-button">Select Wallet</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-3">
                <Button className="create-crypto-button">Create Contract</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-4">
                <Button className="about-contract-button">About Contract</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-5">
                <Button className="agreement-details-button">Agreement Details</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-6">
                <Button className="payment-terms-button">Payment Terms</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-7">
                <Button className="preview-contract-button">Preview Contract</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-8">
                <Button className="contract-created-button">Payment Terms</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-9">
                <Button className="status-1-button">Next</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-10">
                <Button className="status-2-button">Next</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-11">
                <Button className="status-3-button">Next</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-12">
                <Button className="create-contract-button">Create Contract</Button>
                <Button className="last-contractor-button">Last Contractor</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-13">
                <Button className="concept-design-1-button">Next</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-14">
                <Button className="concept-design-2-button">Next</Button>
            </div>
        </Phone>
        <Phone>
            <div className="crypto-image crypto-image-15">
                <Button className="concept-design-3-button">Next</Button>
            </div>
        </Phone>
    </div>
);


export default Home;
