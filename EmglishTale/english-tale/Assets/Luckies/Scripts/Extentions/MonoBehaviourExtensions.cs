using UnityEngine;

public static class MonoBehaviorExtensions
{
    public static void SetupSingleton<TSingleton>(this TSingleton wokenInstance, ref TSingleton singletonInstance, bool persist = false)
        where TSingleton : MonoBehaviour
    {
        if (singletonInstance != null && singletonInstance != wokenInstance)
        {
            // if new script instance is awaken & different instance of the same already exists, destroy the new
            Object.Destroy(wokenInstance.gameObject);

            return;
        }

        singletonInstance = wokenInstance;


        if (persist)
        {
            var parentTransform = singletonInstance.transform;

            while (parentTransform.parent != null)
            {
                parentTransform = parentTransform.parent;
            }

            Object.DontDestroyOnLoad(parentTransform.gameObject);
        }
    }

}
