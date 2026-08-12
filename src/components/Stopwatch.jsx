
import { useEffect, useRef, useState} from "react";

function Stopwatch() {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef(null);

    const clearTimer = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }

    const handleStart = () => {
        if (intervalRef.current !== null) return

        intervalRef.current = setInterval(() => {
            setSeconds ((prev) => prev + 1);
        }, 1000);
    }

    const handleStop = () => {
        clearTimer()
    }

    const handleReset = () => {
        clearTimer()
        setSeconds(0)
    }

    useEffect(() => {
        return () => clearTimer()
    }, [])

    return (
        <section>
            <h1>Секундомер (useRef + serInterval)</h1>
            <p>Прошло секунд: {seconds}</p>
            <div className="stopwatch-controls">
                <button type="button" onClick={handleStart}>
                    Старт
                </button>
                <button type="button" onClick={handleStop}>
                    Стоп
                </button>
                <button type="button" onClick={handleReset}>
                    Сброс
                </button>
            </div>
        </section>
    )
}
export default Stopwatch;