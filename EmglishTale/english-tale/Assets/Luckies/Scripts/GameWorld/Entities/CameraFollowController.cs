using UnityEngine;

[RequireComponent(typeof(Player))]
public class CameraFollowController : MonoBehaviour
{
    public bool followEnabled = true;
    public float xOffset = 0;

    private Camera _mainCamera;
    private Camera MainCamera => _mainCamera ??= Camera.main;
    private float _originalCameraZ = 0f;

    private Player _player = null;
    private Player Player => _player ??= GetComponent<Player>();

    private void Start()
    {
        _originalCameraZ = MainCamera.transform.position.z;
    }

    private void Update()
    {
        if (!followEnabled || MainCamera == null)
            return;

        MainCamera.transform.position = new Vector3(
            transform.position.x + (Player && Player.InBattle ? xOffset : 0),
            transform.position.y,
            _originalCameraZ
        );
    }
}
