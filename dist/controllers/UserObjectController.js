export class UserObjectController {
    static init() {
        const addObjectButton = document.getElementById('addObjectButton');
        const typeSelect = document.getElementById('addObject-typeSelect');
        const closeAddObjectTypeSelect = document.getElementById('close-addObject-typeSelect');
        const userObjectRecButton = document.getElementById('userObject-rec-button');
        const userObjectEllipticButton = document.getElementById('userObject-elliptic-button');
        const userObjectParabolicButton = document.getElementById('userObject-parabolic-button');
        const userObjectHyperbolicButton = document.getElementById('userObject-hyperbolic-button');
        const userObjectRec = document.getElementById('userObject-rec');
        const userObjectElliptic = document.getElementById('userObject-elliptic');
        const userObjectParabolic = document.getElementById('userObject-parabolic');
        const userObjectHyperbolic = document.getElementById('userObject-hyperbolic');
        const backToAddObjectTypeSelect = document.getElementById('back-to-addObject-typeSelect');
        if (addObjectButton && typeSelect) {
            addObjectButton.addEventListener('click', () => {
                typeSelect.style.display = 'block';
            });
        }
        if (typeSelect && closeAddObjectTypeSelect) {
            closeAddObjectTypeSelect.addEventListener('click', () => {
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectRecButton && userObjectRec && typeSelect) {
            userObjectRecButton.addEventListener('click', () => {
                userObjectRec.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectEllipticButton && userObjectElliptic && typeSelect) {
            userObjectEllipticButton.addEventListener('click', () => {
                userObjectElliptic.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectParabolicButton && userObjectParabolic && typeSelect) {
            userObjectParabolicButton.addEventListener('click', () => {
                userObjectParabolic.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectHyperbolicButton && userObjectHyperbolic && typeSelect) {
            userObjectHyperbolicButton.addEventListener('click', () => {
                userObjectHyperbolic.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (backToAddObjectTypeSelect && typeSelect && userObjectRec && userObjectElliptic && userObjectParabolic && userObjectHyperbolic) {
            backToAddObjectTypeSelect.addEventListener('click', () => {
                typeSelect.style.display = 'block';
                userObjectRec.style.display = 'none';
                userObjectElliptic.style.display = 'none';
                userObjectParabolic.style.display = 'none';
                userObjectHyperbolic.style.display = 'none';
            });
        }
    }
    static addObject() {
        console.log('addObject clicked');
    }
}
//# sourceMappingURL=UserObjectController.js.map