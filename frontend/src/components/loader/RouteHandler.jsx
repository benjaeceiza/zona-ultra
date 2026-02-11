import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoader } from '../../context/LoaderContext';

const RouteHandler = () => {
    const location = useLocation();
    const { showLoader, hideLoader } = useLoader();

    // Usamos un ref para guardar la ubicación anterior y evitar disparos falsos
    const prevLocation = useRef(location.pathname);

    useLayoutEffect(() => {
        // Si la ruta es la misma, no hacemos nada (evita loops por query params si no los quieres)
        if (prevLocation.current === location.pathname) {
            // Opcional: si quieres que cargue igual aunque sea la misma ruta, quita este if
            // pero actualizamos el ref por si acaso.
            return;
        }
        prevLocation.current = location.pathname;

        showLoader();

        const timer = setTimeout(() => {
            hideLoader();
        }, 1000); // 1 segundo

        return () => clearTimeout(timer);

        // IMPORTANTE: Quitamos showLoader y hideLoader de las dependencias
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, showLoader, hideLoader]);

    return null;
};

export default RouteHandler;