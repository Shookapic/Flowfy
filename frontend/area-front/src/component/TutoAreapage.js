import React, { useState } from "react";
import Navbar from "./Navbar";
import { TypeAnimation } from "react-type-animation";
import Footer from "./Footer";
import Selectservice from "../assets/tutoAreapage/select_service.gif";
import Connectservice from "../assets/tutoAreapage/connect_service.gif";
import SelectActionReaction from "../assets/tutoAreapage/select_action_reaction.gif";
import flowfy from "../assets/tutoAreapage/flowfy.jpg";
import { useNavigate } from "react-router-dom";

function TutoAreapage() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(1); // État pour la diapositive active

    const setskiped = () => {
        navigate('/services');
    };

    // Texte en fonction de l'ID de la diapositive
    const slideTexts = {
        1: "Select the service you want to connect.",
        2: "Authenticate and connect the selected service.",
        3: "Choose an action and reaction for your automation.",
        4: "You're ready to start! Enjoy using our service."
    };

    const handleSlideChange = (newSlide) => {
        setCurrentSlide(newSlide);
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-end">
                    <button onClick={setskiped} className="btn btn-error text-white px-4 py-2 rounded-lg">Skip</button>
                </div>
                <div className="flex justify-center">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold text-center">Welcome to the tutorial area</h1>
                        <p className="text-lg mt-4 text-center">This area is here to help you understand how to use our service.</p>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                <div className="carousel w-full">
                    <div id="slide1" className="carousel-item relative w-full">
                        <img src={Selectservice} alt="" className="w-full" />
                        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                            <a href="#slide4" onClick={() => handleSlideChange(4)} className="btn btn-circle">❮</a>
                            <a href="#slide2" onClick={() => handleSlideChange(2)} className="btn btn-circle">❯</a>
                        </div>
                    </div>
                    <div id="slide2" className="carousel-item relative w-full">
                        <img src={Connectservice} alt="" className="w-full" />
                        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                            <a href="#slide1" onClick={() => handleSlideChange(1)} className="btn btn-circle">❮</a>
                            <a href="#slide3" onClick={() => handleSlideChange(3)} className="btn btn-circle">❯</a>
                        </div>
                    </div>
                    <div id="slide3" className="carousel-item relative w-full">
                        <img src={SelectActionReaction} alt=""  className="w-full" />
                        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                            <a href="#slide2" onClick={() => handleSlideChange(2)} className="btn btn-circle">❮</a>
                            <a href="#slide4" onClick={() => handleSlideChange(4)} className="btn btn-circle">❯</a>
                        </div>
                    </div>
                    <div id="slide4" className="carousel-item relative w-full">
                        <img src={flowfy} alt="" className="w-full" />
                        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                            <a href="#slide3" onClick={() => handleSlideChange(3)} className="btn btn-circle">❮</a>
                            <a href="#slide1" onClick={() => handleSlideChange(1)} className="btn btn-circle">❯</a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center">
                    {/* Texte animé */}
                    <TypeAnimation
                        key={currentSlide} // Forcer la recréation lorsque `currentSlide` change
                        sequence={[
                            slideTexts[currentSlide], // Texte basé sur la diapositive actuelle
                            1000, // Pause pendant 1 seconde
                        ]}
                        wrapper="p"
                        className="text-lg text-center font-semibold"
                        repeat={1} // Répète une seule fois
                    />
                </div>
            </div>
            <Footer />
        </>
    );
}

export default TutoAreapage;
