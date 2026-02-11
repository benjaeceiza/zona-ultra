import { createContext, useContext, useState, useCallback } from 'react';
import Loader from '../components/loader/Loader';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    // useCallback "congela" la función para que no se recree en cada render
    const showLoader = useCallback(() => setIsLoading(true), []);
    const hideLoader = useCallback(() => setIsLoading(false), []);

    return (
        <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
            {<Loader isVisible={isLoading} />}
            {children}
        </LoaderContext.Provider>
    );
};

export const useLoader = () => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader debe ser usado dentro de un LoaderProvider');
    }
    return context;
};