import React, { useState, useRef, useEffect, useCallback } from "react";
import Confetti from 'react-confetti';
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./App.css";

const initialWords = [
  {  id: 1, text: "ลิง" },
  {  id: 2, text: "กล้วย" },
  {  id: 3, text: "งานเทศกาล" },
  {  id: 4, text: "ความสุข" },
  {  id: 5, text: "โชคดี" },
  {  id: 6, text: "สีเหลือง" }
];

const initialImages = [
  { id: 1, src: "/Images/monkey", alt: "monkey" },
  { id: 2, src: "/Images/banana", alt: "banana" },
  { id: 3, src: "/Images/festival", alt: "festival" },
  { id: 4, src: "/Images/happiness", alt: "happiness" },
  { id: 5, src: "/Images/luck", alt: "luck" },
  { id: 6, src: "/Images/yellow", alt: "yellow" }
];

// DraggableWord component for draggable words with circles
const DraggableWord = ({ word, isMatched }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "word",
    item: { id: word.id },
    canDrag: !isMatched, // Prevent dragging if already matched
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div className="word-container">
      <div
        ref={drag}
        className={`word ${isMatched ? "matched" : ""}`} 
        style={{ opacity: isDragging ? 0.5 : isMatched ? 0.5 : 1 }}
        id={`word-${word.id}`}
      >
        {word.text}
      </div>
      <div className={`wordCircle ${isMatched ? "matched-circle" : ""}`} id={`word-circle-${word.id}`} />
    </div>
  );
};

// Droppable component for images
const DroppableImage = ({ image, isMatched, onDrop }) => {
  const [, drop] = useDrop({
    accept: "word",
    drop: (draggedWord) => onDrop(draggedWord, image),
  });

  return (
    <div ref={drop} className="image-container">
      <div className={`imageCircle ${isMatched ? "matched-circle" : ""}`} id={`image-circle-${image.id}`} />
      <div className={`image ${isMatched ? "matched" : ""}`} id={`image-${image.id}`}>
        <picture>
          <source srcSet={`${image.src}.webp`} type="image/webp" />
          <img src={`${image.src}.png`} alt={image.alt} />
        </picture>
      </div>
    </div>
  );
};

const shuffleArray = (array) => {
  const shuffled = array.slice(); // Copy the array to avoid modifying the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const App = () => {
  
  const [words, setWords] = useState([]);
  const [images, setImages] = useState([]);
  const [matches, setMatches] = useState([]); 
  const [points, setPoints] = useState(0); 
  const [showConfetti, setShowConfetti] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (points === 6) {
      setShowConfetti(true);
      setPopupMessage("Congrats, you win!");
    }
  }, [points]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 7000); 

      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  useEffect(() => {
    setWords(shuffleArray(initialWords));
    setImages(shuffleArray(initialImages));
  }, []);

  const drawAllLines = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    matches.forEach(({ word, image }) => {
      const wordCircle = document.getElementById(`word-circle-${word.id}`);
      const imageCircle = document.getElementById(`image-circle-${image.id}`);
      if (wordCircle && imageCircle) {
        const wordRect = wordCircle.getBoundingClientRect();
        const imageRect = imageCircle.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        const startX = wordRect.left + wordRect.width / 2 - canvasRect.left;
        const startY = wordRect.top + wordRect.height / 2 - canvasRect.top;
        const endX = imageRect.left + imageRect.width / 2 - canvasRect.left;
        const endY = imageRect.top + imageRect.height / 2 - canvasRect.top;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "black";
        ctx.stroke();
      }
    });
  }, [matches]);
    
  useEffect(() => {
    const setCanvasSize = () => {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawAllLines();
    };
    
    let debounceTimeout;
    const onScrollOrResize = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        drawAllLines();
      }, 150); 
    };
    
  
    setCanvasSize();
    drawAllLines();
  
    window.addEventListener("resize", setCanvasSize);
    window.addEventListener("wheel", onScrollOrResize);
  
    return () => {
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("wheel", onScrollOrResize);
      clearTimeout(debounceTimeout);
    };
  }, [matches, drawAllLines]);
  

  const handleDrop = (word, image) => {
    const alreadyMatched = matches.some(
      (match) => match.word.id === word.id && match.image.id === image.id
    );
  
    if (!alreadyMatched && word.id === image.id) {
      
      setMatches((prev) => [...prev, { word, image }]);
      setPoints((prevPoints) => prevPoints + 1);
      
    } else {
      setPopupMessage("Incorrect match!");
      shakeBoxes(word.id, image.id);
      setTimeout(() => setPopupMessage(null), 1000);
    }
  };

  const shakeBoxes = (wordId, imageId) => {
    const wordElement = document.getElementById(`word-${wordId}`);
    const imageElement = document.getElementById(`image-${imageId}`);

    if (wordElement && imageElement) {
      wordElement.classList.add("shake-box");
      imageElement.classList.add("shake-box");

      setTimeout(() => {
        wordElement.classList.remove("shake-box");
        imageElement.classList.remove("shake-box");
      }, 300);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <div className="title-container">
          <h1>Match Thai Words with Their Pictures</h1>
        </div>

        <div className="points-box">
          <h2>Points: {points}</h2>
          {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
        </div>

        <canvas ref={canvasRef} className="canvas" />

        <div id="game-container" className="game-grid">
          <div className="words">
            {words.map((word) => (
              <DraggableWord
                key={word.id}
                word={word}
                onDrop={handleDrop}
                isMatched={matches.some((match) => match.word.id === word.id)}
              />
            ))}
          </div>

          <div className="images">
            {images.map((image) => (
              <DroppableImage
                key={image.id}
                image={image}
                onDrop={handleDrop}  
                isMatched={matches.some((match) => match.image.id === image.id)}
              />
            ))}
          </div>
        </div>

        {popupMessage && <div className="popup">{popupMessage}</div>}
      </div>
    </DndProvider>
  );
};

export default App;